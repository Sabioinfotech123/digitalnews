"""Local / regional news browse + import.

Primary provider: Google News RSS (fast, no API key).
Optional: NewsAPI.org when NEWS_API_KEY is set (richer text/images).
"""

from __future__ import annotations

import hashlib
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import date, datetime, timezone
from email.utils import parsedate_to_datetime
from threading import Lock

from fastapi import HTTPException, status

from app.core.config import Settings, get_settings
from app.schemas.local_news import (
    INDIA_STATES,
    LocalNewsArticle,
    LocalNewsListResponse,
    LocalNewsStateOption,
)

_CACHE: dict[str, tuple[float, LocalNewsArticle]] = {}
_CACHE_LOCK = Lock()
_CACHE_TTL_SEC = 60 * 60

NEWSAPI_URL = "https://newsapi.org/v2/everything"
GOOGLE_NEWS_RSS = "https://news.google.com/rss/search"

STATE_QUERY: dict[str, str] = {
    "Telangana": "Hyderabad OR Telangana OR GHMC OR Secunderabad",
    "Hyderabad": "Hyderabad OR GHMC OR Secunderabad OR Hyd",
    "Andhra Pradesh": '"Andhra Pradesh" OR Visakhapatnam OR Vijayawada OR Amaravati',
    "Karnataka": "Bengaluru OR Bangalore OR Karnataka",
    "Maharashtra": "Mumbai OR Pune OR Maharashtra",
    "Tamil Nadu": '"Tamil Nadu" OR Chennai OR Coimbatore',
    "Kerala": "Kerala OR Kochi OR Thiruvananthapuram",
    "Delhi": "Delhi OR NCR OR Gurugram OR Noida",
    "West Bengal": '"West Bengal" OR Kolkata',
    "Gujarat": "Gujarat OR Ahmedabad OR Surat",
    "Rajasthan": "Rajasthan OR Jaipur",
    "Uttar Pradesh": '"Uttar Pradesh" OR Lucknow OR Noida',
    "Madhya Pradesh": '"Madhya Pradesh" OR Bhopal OR Indore',
    "Odisha": "Odisha OR Bhubaneswar",
    "Punjab": "Punjab OR Chandigarh OR Amritsar",
    "Haryana": "Haryana OR Gurugram OR Faridabad",
    "Bihar": "Bihar OR Patna",
    "Jharkhand": "Jharkhand OR Ranchi",
    "Assam": "Assam OR Guwahati",
    "Goa": "Goa OR Panaji",
    "India": "India",
}

# TV / broadcast news channels to exclude (source name + domains).
CHANNEL_SOURCE_BLOCKLIST: tuple[str, ...] = (
    "ndtv",
    "news18",
    "cnn-news18",
    "cnn news18",
    "times now",
    "timesnow",
    "republic",
    "republic tv",
    "republic world",
    "india today",
    "aaj tak",
    "aajtak",
    "zee news",
    "zeenews",
    "abp news",
    "abp live",
    "newsx",
    "mirror now",
    "wion",
    "cnbc",
    "cnbctv18",
    "tv18",
    "bbc",
    "bbc news",
    "cnn",
    "al jazeera",
    "sky news",
    "fox news",
    "dd news",
    "ddnews",
    "news on air",
    "newsonair",
    "all india radio",
    "air news",
    "doordarshan",
    "india tv",
    "indiatv",
    "news nation",
    "news24",
    "tv9",
    "tv9 telugu",
    "tv9 bharatvarsh",
    "ntv",
    "t news",
    "t-news",
    "v6 news",
    "10tv",
    "sakshi tv",
    "etv",
    "etv telangana",
    "hmtv",
    "i news",
    "inews",
)

CHANNEL_DOMAIN_BLOCKLIST: tuple[str, ...] = (
    "ndtv.com",
    "news18.com",
    "indiatoday.in",
    "timesnownews.com",
    "republicworld.com",
    "zeenews.india.com",
    "aajtak.in",
    "abplive.com",
    "newsx.com",
    "wionews.com",
    "cnbctv18.com",
    "bbc.com",
    "bbc.co.uk",
    "cnn.com",
    "aljazeera.com",
    "ddnews.gov.in",
    "newsonair.gov.in",
    "indiatvnews.com",
    "tv9telugu.com",
    "tv9hindi.com",
    "ntvtelugu.com",
    "tnews.tv",
    "v6velugu.com",
    "10tv.in",
    "sakshi.com",
    "etvbharat.com",
    "hmtv.in",
    "youtube.com",
    "youtu.be",
)

# Non-news / PR noise often returned by broad Google queries
NOISE_SOURCE_BLOCKLIST: tuple[str, ...] = (
    "deloitte",
    "bookmyshow",
    "pr newswire",
    "business wire",
    "globenewswire",
    "ein presswire",
    "linkedin",
    "facebook",
    "instagram",
    "twitter",
    "x.com",
)

# Local / regional press domains (not TV channels) — preferred Google News sites
LOCAL_PRESS_SITES: dict[str, tuple[str, ...]] = {
    "Telangana": (
        "telanganatoday.com",
        "thehansindia.com",
        "deccanchronicle.com",
        "siasat.com",
        "greatandhra.com",
        "newindianexpress.com",
        "thehindu.com",
        "hindustantimes.com",
        "timesofindia.indiatimes.com",
        "indianexpress.com",
        "deccanherald.com",
        "freepressjournal.in",
    ),
    "Andhra Pradesh": (
        "thehansindia.com",
        "deccanchronicle.com",
        "greatandhra.com",
        "newindianexpress.com",
        "thehindu.com",
        "timesofindia.indiatimes.com",
    ),
    "India": (
        "thehindu.com",
        "indianexpress.com",
        "hindustantimes.com",
        "newindianexpress.com",
        "deccanherald.com",
        "thewire.in",
        "scroll.in",
    ),
}

_SLUG_RE = re.compile(r"[^a-z0-9]+")
_IMG_RE = re.compile(r'<img[^>]+src=["\']([^"\']+)["\']', re.I)
_TAG_RE = re.compile(r"<[^>]+>")


def article_id_from_url(url: str) -> str:
    return hashlib.sha256(url.strip().encode("utf-8")).hexdigest()[:24]


def list_state_options() -> list[LocalNewsStateOption]:
    return [LocalNewsStateOption(value=s, label=s) for s in INDIA_STATES]


def _cache_put(article: LocalNewsArticle) -> None:
    with _CACHE_LOCK:
        _CACHE[article.id] = (time.time(), article)


def _cache_get(article_id: str) -> LocalNewsArticle | None:
    with _CACHE_LOCK:
        entry = _CACHE.get(article_id)
        if not entry:
            return None
        ts, article = entry
        if time.time() - ts > _CACHE_TTL_SEC:
            _CACHE.pop(article_id, None)
            return None
        return article


def _build_query(*, state: str, q: str | None) -> str:
    state_part = STATE_QUERY.get(state) or STATE_QUERY["Telangana"]
    extra = (q or "").strip()
    if extra:
        return f"({state_part}) AND ({extra})"
    return state_part


def _channel_site_exclusions() -> str:
    # Keep Google query shorter — only top national TV domains
    top = CHANNEL_DOMAIN_BLOCKLIST[:18]
    return " ".join(f"-site:{domain}" for domain in top)


def _local_press_site_clause(state: str) -> str:
    sites = LOCAL_PRESS_SITES.get(state) or LOCAL_PRESS_SITES.get("India") or ()
    if not sites:
        return ""
    return "(" + " OR ".join(f"site:{domain}" for domain in sites) + ")"


def _is_blocked_source(article: LocalNewsArticle) -> bool:
    """True for TV/news channels and obvious non-news/PR noise."""
    source = (article.source_name or "").strip().lower()
    if source:
        for blocked in CHANNEL_SOURCE_BLOCKLIST:
            if blocked == source or blocked in source:
                return True
        for blocked in NOISE_SOURCE_BLOCKLIST:
            if blocked == source or blocked in source:
                return True

    url = (article.url or "").lower()
    try:
        host = urllib.parse.urlparse(url).netloc.lower()
    except Exception:
        host = ""
    host = host.removeprefix("www.")
    for domain in CHANNEL_DOMAIN_BLOCKLIST:
        if host == domain or host.endswith("." + domain) or domain in url:
            return True
    return False


def _filter_articles(articles: list[LocalNewsArticle]) -> list[LocalNewsArticle]:
    kept: list[LocalNewsArticle] = []
    seen: set[str] = set()
    for article in articles:
        if _is_blocked_source(article):
            continue
        if article.id in seen:
            continue
        seen.add(article.id)
        kept.append(article)
    return kept


def _strip_html(value: str) -> str:
    text = _TAG_RE.sub(" ", value or "")
    return re.sub(r"\s+", " ", text).strip()


def _http_get(url: str, *, timeout: int = 20, accept: str = "*/*") -> bytes:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (compatible; DigitalNewsLocalNews/1.1)",
            "Accept": accept,
        },
        method="GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.read()
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:400]
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Local news provider error ({exc.code}): {detail or exc.reason}",
        ) from exc
    except urllib.error.URLError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Could not reach local news provider: {exc.reason}",
        ) from exc


def _http_get_json(url: str, timeout: int = 20) -> dict:
    raw = _http_get(url, timeout=timeout, accept="application/json")
    body = raw.decode("utf-8", errors="replace").strip()
    if not body:
        return {}
    try:
        data = json.loads(body)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Local news provider returned invalid JSON: {body[:200]}",
        ) from exc
    return data if isinstance(data, dict) else {}


def _parse_rfc822(value: str | None) -> str | None:
    if not value:
        return None
    try:
        dt = parsedate_to_datetime(value)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc).isoformat()
    except (TypeError, ValueError, IndexError):
        return value


def _article_calendar_day(published_at: str | None) -> date | None:
    """Best-effort UTC calendar day from ISO or RFC822 published strings."""
    if not published_at:
        return None
    value = published_at.strip()
    if not value:
        return None
    try:
        if value.endswith("Z"):
            value = value[:-1] + "+00:00"
        dt = datetime.fromisoformat(value)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc).date()
    except ValueError:
        pass
    try:
        dt = parsedate_to_datetime(published_at)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc).date()
    except (TypeError, ValueError, IndexError):
        return None


def _parse_ymd(value: str | None) -> date | None:
    if not value:
        return None
    try:
        return date.fromisoformat(value.strip()[:10])
    except ValueError:
        return None


def _filter_by_date_range(
    articles: list[LocalNewsArticle],
    *,
    from_date: str | None,
    to_date: str | None,
) -> list[LocalNewsArticle]:
    """Inclusive local-day filter. Google RSS often ignores after:/before: — enforce here."""
    start = _parse_ymd(from_date)
    end = _parse_ymd(to_date)
    if start is None and end is None:
        return articles
    kept: list[LocalNewsArticle] = []
    for article in articles:
        day = _article_calendar_day(article.published_at)
        if day is None:
            continue
        if start is not None and day < start:
            continue
        if end is not None and day > end:
            continue
        kept.append(article)
    return kept


def _map_newsapi_article(raw: dict) -> LocalNewsArticle | None:
    url = (raw.get("url") or "").strip()
    title = (raw.get("title") or "").strip()
    if not url or not title or title == "[Removed]":
        return None
    source = raw.get("source") if isinstance(raw.get("source"), dict) else {}
    image = (raw.get("urlToImage") or "").strip() or None
    description = (raw.get("description") or raw.get("content") or "").strip() or None
    published = raw.get("publishedAt")
    return LocalNewsArticle(
        id=article_id_from_url(url),
        title=title,
        description=description,
        content=(raw.get("content") or None),
        url=url,
        image_url=image,
        source_name=(source.get("name") if isinstance(source, dict) else None),
        published_at=published if isinstance(published, str) else None,
        language=None,
        country=None,
    )


def _map_rss_item(item: ET.Element) -> LocalNewsArticle | None:
    title = (item.findtext("title") or "").strip()
    link = (item.findtext("link") or "").strip()
    if not title or not link:
        return None
    description_html = item.findtext("description") or ""
    description = _strip_html(description_html) or None
    img_match = _IMG_RE.search(description_html)
    image = img_match.group(1) if img_match else None
    source_el = item.find("source")
    source_name = (source_el.text or "").strip() if source_el is not None else None
    return LocalNewsArticle(
        id=article_id_from_url(link),
        title=title,
        description=description,
        content=None,
        url=link,
        image_url=image,
        source_name=source_name or None,
        published_at=_parse_rfc822(item.findtext("pubDate")),
        language=None,
        country="India",
    )


class LocalNewsService:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()

    def list_articles(
        self,
        *,
        state: str = "Telangana",
        q: str | None = None,
        from_date: str | None = None,
        to_date: str | None = None,
        page: int = 1,
        page_size: int = 10,
    ) -> LocalNewsListResponse:
        page = max(1, page)
        page_size = min(max(1, page_size), 50)
        query = _build_query(state=state, q=q)

        if self.settings.news_api_key.strip():
            return self._list_newsapi(
                query=query,
                state=state,
                from_date=from_date,
                to_date=to_date,
                page=page,
                page_size=page_size,
            )
        return self._list_google_rss(
            query=query,
            state=state,
            from_date=from_date,
            to_date=to_date,
            page=page,
            page_size=page_size,
        )

    def _list_newsapi(
        self,
        *,
        query: str,
        state: str,
        from_date: str | None,
        to_date: str | None,
        page: int,
        page_size: int,
    ) -> LocalNewsListResponse:
        params: dict[str, str] = {
            "q": query,
            "language": "en",
            "sortBy": "publishedAt",
            "pageSize": str(page_size),
            "page": str(page),
            "apiKey": self.settings.news_api_key.strip(),
        }
        if from_date:
            params["from"] = from_date
        if to_date:
            params["to"] = to_date
        url = f"{NEWSAPI_URL}?{urllib.parse.urlencode(params)}"
        data = _http_get_json(url)
        if data.get("status") == "error":
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=data.get("message") or "NewsAPI error",
            )
        raw_items = data.get("articles") or []
        articles: list[LocalNewsArticle] = []
        for raw in raw_items:
            if not isinstance(raw, dict):
                continue
            mapped = _map_newsapi_article(raw)
            if not mapped:
                continue
            _cache_put(mapped)
            articles.append(mapped)
        articles = _filter_articles(articles)
        articles = _filter_by_date_range(articles, from_date=from_date, to_date=to_date)
        total = len(articles)
        # NewsAPI totalResults includes channels we dropped — report filtered count for this page batch
        return LocalNewsListResponse(
            items=articles,
            total=total,
            page=page,
            page_size=page_size,
            state=state,
            query=query,
            provider="newsapi",
        )

    def _list_google_rss(
        self,
        *,
        query: str,
        state: str,
        from_date: str | None,
        to_date: str | None,
        page: int,
        page_size: int,
    ) -> LocalNewsListResponse:
        # Prefer local/regional press sites; exclude major TV channel domains.
        # Put after:/before: first — Google often ignores them when buried under many site: clauses.
        q_parts: list[str] = []
        if from_date:
            q_parts.append(f"after:{from_date}")
        if to_date:
            # before: is inclusive on the given day for News RSS; keep as selected end date.
            q_parts.append(f"before:{to_date}")
        q_parts.append(f"({query})")
        press = _local_press_site_clause(state)
        if press:
            q_parts.append(press)
        q_parts.append(_channel_site_exclusions())
        params = {
            "q": " ".join(part for part in q_parts if part),
            "hl": "en-IN",
            "gl": "IN",
            "ceid": "IN:en",
        }
        url = f"{GOOGLE_NEWS_RSS}?{urllib.parse.urlencode(params)}"
        xml_bytes = _http_get(url, accept="application/rss+xml, application/xml, text/xml, */*")
        try:
            root = ET.fromstring(xml_bytes)
        except ET.ParseError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Local news RSS parse failed",
            ) from exc

        channel = root.find("channel")
        items = channel.findall("item") if channel is not None else root.findall(".//item")
        articles: list[LocalNewsArticle] = []
        for item in items:
            mapped = _map_rss_item(item)
            if not mapped:
                continue
            _cache_put(mapped)
            articles.append(mapped)

        articles = _filter_articles(articles)
        articles = _filter_by_date_range(articles, from_date=from_date, to_date=to_date)
        total = len(articles)
        start = (page - 1) * page_size
        end = start + page_size
        return LocalNewsListResponse(
            items=articles[start:end],
            total=total,
            page=page,
            page_size=page_size,
            state=state,
            query=query,
            provider="google-news-rss",
        )

    def get_article(self, article_id: str) -> LocalNewsArticle:
        cached = _cache_get(article_id)
        if cached:
            return cached
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found or expired. Go back to Local news list and open it again.",
        )

    def build_import_content(
        self,
        article: LocalNewsArticle,
        *,
        title: str | None = None,
        short_description: str | None = None,
        image_url: str | None = None,
    ) -> tuple[str, str, str, str]:
        """Returns (title, short_description, content_html, image_url)."""
        final_title = (title or article.title).strip()[:300]
        short = (
            short_description
            if short_description is not None
            else (article.description or article.title)
        )
        short = (short or final_title).strip()[:500]
        source = article.source_name or "source"
        body_parts = [
            f"<p>{_escape_html(short)}</p>",
            f'<p><a href="{_escape_attr(article.url)}" target="_blank" rel="noopener noreferrer">'
            f"Read original article</a></p>",
            f"<p><em>Imported from local news · {_escape_html(source)}</em></p>",
        ]
        content = "\n".join(body_parts)
        image = (image_url if image_url is not None else article.image_url) or ""
        image = image.strip() or self.settings.local_news_placeholder_image
        return final_title, short, content, image


def slugify_title(title: str) -> str:
    base = _SLUG_RE.sub("-", title.lower()).strip("-")
    base = base[:80] or "local-news"
    return base


def _escape_html(value: str) -> str:
    return (
        value.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def _escape_attr(value: str) -> str:
    return _escape_html(value).replace("'", "&#39;")
