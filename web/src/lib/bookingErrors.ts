export const bookingErrorMessages: Record<string, string> = {
  weekly_limit_reached: "Dostigli ste nedeljni limit.",
  session_full: "Termin je popunjen.",
  session_closed: "Termin je trenutno zatvoren za prijave.",
  already_joined: "Već ste prijavljeni na ovaj termin.",
  not_authenticated: "Niste prijavljeni.",
  account_inactive: "Vaš nalog je deaktiviran. Obratite se administratoru.",
  session_not_found: "Termin nije pronađen.",
};

export const getBookingErrorMessage = (
  rawMessage: string,
  mapRpcCodes = true,
) => {
  if (mapRpcCodes) {
    const code = Object.keys(bookingErrorMessages).find((key) =>
      rawMessage.includes(key),
    );

    if (code) return bookingErrorMessages[code];
  }

  const fallback = "Došlo je do greške. Pokušajte ponovo.";
  return import.meta.env.DEV && rawMessage
    ? `${fallback}\n\n${rawMessage}`
    : fallback;
};
