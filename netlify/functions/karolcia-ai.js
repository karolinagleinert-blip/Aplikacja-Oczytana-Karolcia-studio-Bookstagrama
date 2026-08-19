exports.handler = async function (event) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  };

  const reply = (statusCode, data) => ({
    statusCode,
    headers,
    body: JSON.stringify(data)
  });

  if (event.httpMethod !== "POST") {
    return reply(405, {
      error: "Dozwolone są tylko zapytania POST."
    });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return reply(500, {
        error: "Brak GEMINI_API_KEY w ustawieniach Netlify."
      });
    }

    let data;

    try {
      data = JSON.parse(event.body || "{}");
    } catch {
      return reply(400, {
        error: "Aplikacja wysłała nieprawidłowe dane."
      });
    }

    const type = data.type || "Post";
    const book = data.book || {};

    const title = clean(book.title);
    const author = clean(book.author);
    const publisher = clean(book.publisher);
    const genre = clean(book.genre);
    const status = clean(book.status);
    const note = clean(book.note);
    const rating = clean(book.rating);

    if (!title) {
      return reply(400, {
        error: "Najpierw podaj tytuł książki."
      });
    }

    const bookData = [
      `Tytuł: ${title}`,
      author ? `Autor/Autorka: ${author}` : "",
      publisher ? `Wydawnictwo: ${publisher}` : "",
      genre ? `Gatunek/temat: ${genre}` : "",
      status ? `Status: ${status}` : "",
      rating ? `Ocena użytkowniczki: ${rating}/10` : "",
      note ? `Własne wrażenia użytkowniczki:\n${note}` :
        "Własne wrażenia użytkowniczki: BRAK"
    ]
      .filter(Boolean)
      .join("\n");

    const prompt = `
Jesteś asystentką polskiego profilu książkowego
„Oczytana Karolcia”.

Masz przygotować gotową treść na Instagram.

FORMAT:
${type}

DANE:
${bookData}

NAJWAŻNIEJSZA ZASADA:
Własne wrażenia użytkowniczki są podstawą opinii.
Nie wymyślaj faktów o publikacji.

Nie wymyślaj:
- fabuły,
- bohaterów,
- wydarzeń,
- cytatów,
- zakończenia,
- wydawnictwa,
- autora,
- opinii użytkowniczki.

Nie korzystaj z własnej wiedzy o tytule.

Jeżeli czegoś nie ma w danych, po prostu to pomiń.
Nie wpisuj „brak danych” w gotowej publikacji.

Pisz w pierwszej osobie, naturalnym polskim językiem.
Tekst ma brzmieć jak szczera wypowiedź czytelniczki,
a nie reklama ani tekst AI.

Unikaj zdań takich jak:
„prawdziwa uczta dla czytelnika”,
„pozycja obowiązkowa”,
„z pewnością znajdzie swoich odbiorców”,
„zaprezentowana atmosfera”,
„nie sposób się oderwać”,
„zostanie ze mną na długo”,
jeżeli użytkowniczka sama nie wyraziła takiej opinii.

Nie wyolbrzymiaj krótkiej notatki.
Możesz ją uporządkować, rozwinąć językowo i połączyć
w płynną wypowiedź, ale nie dodawaj nowych doświadczeń.

Jeżeli FORMAT to Recenzja:

Jeżeli nie ma własnych wrażeń użytkowniczki,
nie udawaj przeczytania. Przygotuj zapowiedź zamiast recenzji.

Jeżeli są własne wrażenia, rozpocznij:

📚❤️ RECENZJA

📖 Tytuł: ${title}
${author ? `✍️ Autor/Autorka: ${author}` : ""}
${publisher ? `🏢 Wydawnictwo: ${publisher}` : ""}
${genre ? `📚 Temat/gatunek: ${genre}` : ""}
${rating ? `⭐ Moja ocena: ${rating}/10` : ""}

Następnie napisz osobistą recenzję.

Celuj w około 1800–2200 znaków WYŁĄCZNIE wtedy,
gdy przekazane wrażenia dają wystarczająco dużo materiału.

Jeśli materiału jest mniej, napisz krótszą, dobrą recenzję.
Nie produkuj pustych zdań tylko po to, żeby osiągnąć limit.

Uwzględniaj klimat, emocje, tempo, język, bohaterów,
zalety lub wady tylko wtedy, gdy użytkowniczka wspomniała
o nich w swoich wrażeniach.

Zakończ jednym naturalnym pytaniem do obserwatorów.
Dodaj dokładnie 5 dopasowanych hashtagów.

Jeżeli FORMAT to Post:
Napisz naturalny post 600–1000 znaków.
Zakończ jednym pytaniem i dokładnie 5 hashtagami.

Jeżeli FORMAT to Reel:
Przygotuj:
- hook na pierwsze 2–3 sekundy,
- krótkie napisy czasowe,
- tekst lektorski,
- opis,
- CTA,
- dokładnie 5 hashtagów.
Nie wymagaj pokazywania twarzy.

Jeżeli FORMAT to Stories:
Przygotuj krótką serię Stories bez pokazywania twarzy.

Jeżeli FORMAT to Karuzela:
Przygotuj 6 slajdów:
1. Hook
2. O czym jest publikacja — tylko jeśli wynika z danych
3. Największa zaleta
4. Co może nie spodobać się każdemu
5. Dla kogo
6. Ocena i jedno pytanie

Nie wymyślaj punktów 2–5, jeżeli nie wynikają z danych.

Jeżeli FORMAT to Hashtagi:
Zwróć wyłącznie dokładnie 5 hashtagów.

NIE dodawaj:
- Character count,
- liczby znaków,
- komentarza od AI,
- wyjaśnienia swojej pracy,
- tekstu przed właściwą publikacją.

Zwróć wyłącznie gotową treść.
`;

    const model = "gemini-3.6-flash";

    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/` +
      `${model}:generateContent`;

    // Próba 1 + maksymalnie 2 automatyczne ponowienia.
    const maxAttempts = 3;

    let lastStatus = 500;
    let lastMessage = "Nie udało się połączyć z Gemini.";

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const controller = new AbortController();

        // Nie pozwalamy pojedynczemu zapytaniu wisieć bez końca.
        const timeout = setTimeout(() => controller.abort(), 20000);

        let response;

        try {
          response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": apiKey
            },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [{ text: prompt }]
                }
              ],
              generationConfig: {
                temperature: 0.55,
                maxOutputTokens: 3500
              }
            }),
            signal: controller.signal
          });
        } finally {
          clearTimeout(timeout);
        }

        lastStatus = response.status;

        let result = {};

        try {
          result = await response.json();
        } catch {
          result = {};
        }

        if (response.ok) {
          const text = result?.candidates?.[0]?.content?.parts
            ?.map(part => part.text || "")
            .join("")
            .trim();

          if (text) {
            return reply(200, {
              text,
              attempt
            });
          }

          lastMessage = "Gemini nie zwróciło tekstu.";
        } else {
          lastMessage =
            result?.error?.message ||
            `Gemini zwróciło błąd ${response.status}.`;
        }

        // Te błędy często są chwilowe — próbujemy ponownie.
        const retryable =
          response.status === 429 ||
          response.status === 500 ||
          response.status === 502 ||
          response.status === 503 ||
          response.status === 504 ||
          /high demand|overloaded|temporar|unavailable/i.test(lastMessage);

        if (!retryable) {
          return reply(response.status || 500, {
            error: lastMessage
          });
        }

      } catch (error) {
        if (error?.name === "AbortError") {
          lastStatus = 504;
          lastMessage = "Gemini zbyt długo nie odpowiadało.";
        } else {
          lastStatus = 502;
          lastMessage = "Chwilowy problem z połączeniem z Gemini.";
        }
      }

      if (attempt < maxAttempts) {
        // 1.5 s po pierwszej próbie, 3 s po drugiej.
        await sleep(1500 * attempt);
      }
    }

    return reply(lastStatus >= 400 ? lastStatus : 503, {
      error:
        "Gemini jest teraz przeciążone lub chwilowo niedostępne. " +
        "Spróbuj ponownie za moment.",
      details: lastMessage
    });

  } catch (error) {
    console.error("Karolcia AI:", error);

    // Nawet nieoczekiwany błąd zwracamy jako JSON.
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error:
          "Karolcia AI napotkała chwilowy problem. Spróbuj ponownie."
      })
    };
  }
};

function clean(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
