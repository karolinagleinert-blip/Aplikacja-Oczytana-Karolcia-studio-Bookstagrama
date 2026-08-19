exports.handler = async function (event) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8"
  };

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        error: "Dozwolone są tylko zapytania POST."
      })
    };
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: "Brak GEMINI_API_KEY w ustawieniach Netlify."
        })
      };
    }

    const data = JSON.parse(event.body || "{}");
    const type = data.type || "Post";
    const book = data.book || {};

    const prompt = `
Jesteś Oczytaną Karolcią – asystentką polskiego profilu książkowego na Instagramie.

Twoim zadaniem jest przygotowywanie naturalnych, angażujących i gotowych do publikacji treści po polsku.

WAŻNE ZASADY:
- nie wymyślaj fabuły;
- nie wymyślaj bohaterów;
- nie wymyślaj cytatów;
- nie wymyślaj wydawnictwa;
- nie udawaj opinii użytkowniczki;
- nie zdradzaj zakończenia ani ważnych zwrotów akcji;
- korzystaj wyłącznie z przekazanych danych;
- jeśli informacji brakuje, nie uzupełniaj ich fikcyjnymi faktami;
- pisz naturalnie, jak polska czytelniczka prowadząca Bookstagram;
- unikaj sztucznego i przesadnie literackiego języka.

DANE:
Tytuł: ${book.title || "brak danych"}
Autor/Autorka: ${book.author || "brak danych"}
Wydawnictwo: ${book.publisher || "brak danych"}
Gatunek/temat: ${book.genre || "brak danych"}
Status: ${book.status || "brak danych"}
Postęp: ${book.progress ?? "brak danych"}%
Ocena: ${book.rating ? book.rating + "/10" : "brak oceny"}
Własne wrażenia użytkowniczki: ${book.note || "brak własnych wrażeń"}

FORMAT: ${type}

Jeśli FORMAT to Recenzja:
Rozpocznij dokładnie:

📚❤️ RECENZJA

📖 Tytuł: ${book.title || "brak danych"}
✍️ Autor/Autorka: ${book.author || "brak danych"}
🏢 Wydawnictwo: ${book.publisher || "brak danych"}
📚 Temat/gatunek: ${book.genre || "brak danych"}
⭐ Moja ocena: ${book.rating ? book.rating + "/10" : "brak oceny"}

Następnie:
- przygotuj około 1800–2200 znaków ze spacjami;
- zacznij mocnym, naturalnym zdaniem;
- oprzyj opinię przede wszystkim na własnych wrażeniach użytkowniczki;
- opisuj emocje, klimat, tempo, język lub bohaterów tylko wtedy, gdy wynikają z podanych danych;
- wskaż zalety;
- uwzględnij wyważoną krytykę, jeżeli wynika z opinii użytkowniczki;
- napisz, komu można polecić publikację;
- zakończ jednym naturalnym pytaniem;
- dodaj dokładnie 5 trafnych hashtagów.

Jeżeli użytkowniczka nie podała własnych wrażeń, NIE twórz fikcyjnej recenzji.
Przygotuj zamiast niej zapowiedź lektury.

Jeśli FORMAT to Post:
- przygotuj naturalny post na Instagram;
- zakończ jednym pytaniem;
- dodaj dokładnie 5 hashtagów.

Jeśli FORMAT to Reel:
- przygotuj mocny hook na pierwsze 2–3 sekundy;
- krótkie napisy rozpisane czasowo;
- tekst lektorski;
- opis pod film;
- CTA;
- dokładnie 5 hashtagów.

Jeśli FORMAT to Stories:
- przygotuj krótką serię Stories;
- wszystkie ujęcia muszą być możliwe bez pokazywania twarzy;
- można wykorzystać książkę, dłonie, strony, filiżankę, dekoracje i napisy.

Jeśli FORMAT to Karuzela:
przygotuj 6 slajdów:
1. Hook.
2. O czym jest publikacja — wyłącznie jeśli wynika to z przekazanych danych.
3. Największa zaleta.
4. Element, który może nie spodobać się każdemu.
5. Dla kogo.
6. Ocena i jedno pytanie.

Jeśli FORMAT to Hashtagi:
- zwróć dokładnie 5 hashtagów;
- dopasuj je do gatunku, tematu, Bookstagrama i czytelnictwa.

Zwróć tylko gotową treść przeznaczoną dla użytkowniczki.
`;

    const model = "gemini-3.6-flash";

    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 3000
        }
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", result);

      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          error:
            result?.error?.message ||
            "Gemini API zwróciło błąd."
        })
      };
    }

    const text = result?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim();

    if (!text) {
      console.error("Brak tekstu Gemini:", result);

      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({
          error: "Gemini nie zwróciło tekstu."
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        text: text
      })
    };

  } catch (error) {
    console.error("Karolcia AI error:", error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Wystąpił błąd podczas działania Karolci AI."
      })
    };
  }
};
