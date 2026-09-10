# Components Plan

## App primitives

AppButton, AppInput, AppTextarea, AppSelect, AppDatePicker, AppModal, AppDrawer, AppCard, AppImage, AppAvatar, AppBadge, AppTable, AppPagination, AppLoader, AppEmpty, AppError, AppConfirm, AppDropdown, AppEditor, AppUpload, AppVideoPlayer, AppBreadcrumb

Each accepts optional `className`.

## Content

NewsCard, FeaturedNewsCard, BlogCard, VideoCard, CategoryCard, BreakingNewsTicker, ShareButtons, SearchBar, LanguageSwitcher, AuthorInfo, RelatedContent

Language-aware rendering — **no** EnglishNewsCard / TeluguNewsCard split.

## Layout

Header, Footer, MobileMenu, AdminLayout, AdminSidebar, AdminHeader

## States

LoadingState, EmptyState, ErrorState, SuccessNotification, ConfirmDialog

## Admin list helpers

TableFilters, StatusBadge, LanguageBadge

## Editor

Wrap an established rich-text editor as `AppEditor` (not built from scratch). Sanitize on client display and server persist.
