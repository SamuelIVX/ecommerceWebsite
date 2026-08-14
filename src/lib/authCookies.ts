/**
 * Single source of truth for the Wix refresh-token cookie name.
 * Both the visitor token minted in middleware and the member token set on
 * login share this one name; readers in wixContext / wixClientServer /
 * NavIcons reference it too. SECURITY: cookie holds a Wix refresh token —
 * do not log it.
 */
export const REFRESH_TOKEN_COOKIE = "refreshToken";
