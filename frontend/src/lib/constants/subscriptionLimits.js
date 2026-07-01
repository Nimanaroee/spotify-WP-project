export const SUBSCRIPTION_LIMITS = {
  basic:  { streamsPerDay: 60,       playlistLimit: 6,        profilePicture: false, download: false, earlyAccess: false, viewStats: false, price: 0 },
  silver: { streamsPerDay: Infinity, playlistLimit: 100,      profilePicture: true,  download: true,  earlyAccess: false, viewStats: false, price: null },
  gold:   { streamsPerDay: Infinity, playlistLimit: Infinity, profilePicture: true,  download: true,  earlyAccess: true,  viewStats: true,  price: null },
}
