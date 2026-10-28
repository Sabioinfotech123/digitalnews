import './AdminCommentReactionCounts.scss'

interface AdminCommentReactionCountsProps {
  likeCount?: number
  dislikeCount?: number
}

export function AdminCommentReactionCounts({
  likeCount = 0,
  dislikeCount = 0,
}: AdminCommentReactionCountsProps) {
  return (
    <div className="admin-comment-reactions" aria-label="Like and dislike counts">
      <span className="admin-comment-reactions__item">
        <i className="fa-solid fa-thumbs-up" aria-hidden />
        {likeCount}
      </span>
      <span className="admin-comment-reactions__item">
        <i className="fa-solid fa-thumbs-down admin-comment-reactions__dislike" aria-hidden />
        {dislikeCount}
      </span>
    </div>
  )
}
