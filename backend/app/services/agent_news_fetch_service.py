"""Fetch trending / latest / viral headlines for the news agent."""

from __future__ import annotations

import urllib.parse
import xml.etree.ElementTree as ET

from app.models.content import ContentLanguage
from app.schemas.agent import AgentSuggestion
from app.services.local_news_service import (
    GOOGLE_NEWS_RSS,
    _filter_articles,
    _http_get,
    article_id_from_url,
)

_AGENT_QUERIES_EN: list[tuple[str, str]] = [
    ("trending", "trending India news when:3d"),
    ("latest", "India latest news when:1d"),
    ("viral", "viral OR trending when:3d India"),
]

_AGENT_QUERIES_TE: list[tuple[str, str]] = [
    ("trending", "తాజా వార్తలు భారతదేశం when:3d"),
    ("latest", "లేటెస్ట్ న్యూస్ ఇండియా when:1d"),
    ("viral", "వైరల్ వార్తలు when:3d"),
]


def _rss_locale(language: ContentLanguage) -> dict[str, str]:
    if language == ContentLanguage.te:
        return {"hl": "te-IN", "gl": "IN", "ceid": "IN:te"}
    return {"hl": "en-IN", "gl": "IN", "ceid": "IN:en"}


def _queries_for(language: ContentLanguage) -> list[tuple[str, str]]:
    if language == ContentLanguage.te:
        return _AGENT_QUERIES_TE
    return _AGENT_QUERIES_EN


def _map_rss_item_for_agent(item: ET.Element, feed: str) -> AgentSuggestion | None:
    title = (item.findtext("title") or "").strip()
    link = (item.findtext("link") or "").strip()
    if not title or not link:
        return None
    desc = (item.findtext("description") or "").strip()
    source_el = item.find("source")
    source_name = (source_el.text or "").strip() if source_el is not None else None
    pub = (item.findtext("pubDate") or "").strip() or None
    return AgentSuggestion(
        id=f"{feed}-{article_id_from_url(link)}",
        title=title,
        description=desc[:500] if desc else None,
        url=link,
        image_url=None,
        source_name=source_name,
        published_at=pub,
        feed=feed,  # type: ignore[arg-type]
    )


def fetch_agent_suggestions(
    *,
    language: ContentLanguage = ContentLanguage.en,
    limit_per_feed: int = 8,
) -> list[AgentSuggestion]:
    locale = _rss_locale(language)
    queries = _queries_for(language)
    merged: list[AgentSuggestion] = []
    seen: set[str] = set()

    for feed, query in queries:
        params = {
            "q": query,
            **locale,
        }
        url = f"{GOOGLE_NEWS_RSS}?{urllib.parse.urlencode(params)}"
        try:
            xml_bytes = _http_get(url, accept="application/rss+xml, application/xml, text/xml, */*")
            root = ET.fromstring(xml_bytes)
        except Exception:
            continue
        channel = root.find("channel")
        items = channel.findall("item") if channel is not None else root.findall(".//item")
        count = 0
        for item in items:
            if count >= limit_per_feed:
                break
            mapped = _map_rss_item_for_agent(item, feed)
            if not mapped:
                continue
            if mapped.id in seen:
                continue
            seen.add(mapped.id)
            merged.append(mapped)
            count += 1

    from app.schemas.local_news import LocalNewsArticle

    wrap = [
        LocalNewsArticle(
            id=s.id,
            title=s.title,
            description=s.description,
            url=s.url,
            image_url=s.image_url,
            source_name=s.source_name,
            published_at=s.published_at,
        )
        for s in merged
    ]
    filtered_ids = {a.id for a in _filter_articles(wrap)}
    return [s for s in merged if s.id in filtered_ids]