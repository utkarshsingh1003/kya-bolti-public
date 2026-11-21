import type { PublicUser, User } from "@/lib/types";

/**
 * Convert a stored user into the shape that is safe to return to a client.
 *
 * Fields are listed explicitly rather than spread so that adding a sensitive
 * column to `User` cannot silently leak through a future `{ ...user }`.
 */
export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    stateId: user.stateId,
    districtId: user.districtId,
    pin: user.pin,
    area: user.area,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
