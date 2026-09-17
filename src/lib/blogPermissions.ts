import type { AuthUser, AppRole } from '../types/api';
import type { BlogPostItem, BlogDetail, BlogComment } from '../types/blog';

const PASTORAL_MODERATOR_ROLES: ReadonlyArray<AppRole> = [
  'CHAPLAIN',
  'CHAPLAIN_LEADER',
  'CHAPLAIN_CONTENT_LEADER',
  'SUPERUSER',
];

/**
 * Publication is open to any authenticated user (including BASIC role).
 * Authorship is strictly non-anonymous.
 */
export function canCreateBlog(user: AuthUser | null): boolean {
  return Boolean(user);
}

/**
 * Only the original author or SUPERUSER can edit a blog.
 */
export function canEditBlog(
  user: AuthUser | null,
  blog: BlogPostItem | BlogDetail
): boolean {
  if (!user) return false;
  return user.userId === blog.authorId || user.role === 'SUPERUSER';
}

/**
 * Can be deleted by the original author (even if BASIC),
 * or by pastoral moderation roles: CHAPLAIN, CHAPLAIN_LEADER, CHAPLAIN_CONTENT_LEADER, SUPERUSER.
 */
export function canDeleteBlog(
  user: AuthUser | null,
  blog: BlogPostItem | BlogDetail
): boolean {
  if (!user) return false;
  if (user.userId === blog.authorId) return true;
  return PASTORAL_MODERATOR_ROLES.includes(user.role);
}

/**
 * Comments can be deleted by their author or any pastoral moderator.
 */
export function canDeleteComment(
  user: AuthUser | null,
  comment: BlogComment
): boolean {
  if (!user) return false;
  if (user.userId === comment.userId) return true;
  return PASTORAL_MODERATOR_ROLES.includes(user.role);
}

/**
 * Only CHAPLAIN_CONTENT_LEADER or SUPERUSER can create new tags.
 */
export function canCreateTag(user: AuthUser | null): boolean {
  if (!user) return false;
  return user.role === 'CHAPLAIN_CONTENT_LEADER' || user.role === 'SUPERUSER';
}
