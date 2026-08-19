exports.handler = async function (event) {

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Dozwolone są tylko zapytania POST."
      })
    };
  }

  try {

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "Brak OPENAI_API_KEY w Netlify."
        })
      };
    }

    const data = JSON.parse(event.body || "{}");

    const type = data.type || "Post";
    const book = data.book || {};

    const prompt = `
Jesteś Oczytaną Karolcią – asystentką polskiego profilu książkowego.

Tworzysz naturalne, gotowe do publikacji treści na Instagram.

NIE WOLNO:
- wymyślać informacji o fabule,
- wymyślać bohaterów,
- wymyślać cytatów,
- wymyślać wydawnictwa,
- udawać opinii użytkowniczki,
- zdradzać zakończenia.

Jeżeli brakuje informacji, zaznacz ich brak.

DANE KSIĄŻKI:

Tytuł: ${book.title || "brak danych"}
Autor/Autorka: ${book.author || "brak danych"}
Wydawnictwo: ${book.publisher || "brak danych"}
Gatunek/temat: ${book.genre || "brak danych"}
Status: ${book.status || "brak danych"}
Postęp: ${book.progress ?? "brak danych"}%
Ocena: ${book.rating || "brak oceny"}
Wrażenia użytkowniczki: ${book.note || "brak własnych wrażeń"}

FORMAT DO PRZYGOTOWANIA:
${type}

ZASADY:

Jeśli format to "Recenzja":
- pełną recenzję twórz tylko wtedy, gdy są własne wrażenia użytkowniczki;
- zacznij dokładnie od:

📚❤️ RECENZJA

📖 Tytuł:
✍️ Autor/Autorka:
🏢 Wydawnictwo:
📚 Temat/gatunek:
⭐ Moja ocena: X/10

- tekst powinien mieć około 1800–2200 znaków ze spacjami;
- rozpocznij mocnym zdaniem;
- pisz naturalnie, emocjonalnie i osobiście;
- nie wymyślaj faktów;
- nie dodawaj spoilerów;
- dodaj wyważoną krytykę;
- wskaż, komu można polecić książkę;
- zakończ jednym pytaniem;
- dodaj dokładnie 5 hashtagów.

Jeżeli nie ma własnych wrażeń, zamiast udawać przeczytaną recenzję
przygotuj zapowiedź lub post przed czytaniem i wyraźnie to zaznacz.

Jeśli format to "Post":
przygotuj naturalny post na Instagram i dokładnie 5 hashtagów.

Jeśli format to "Reel":
przygotuj:
- hook na pierwsze 2–3 sekundy,
- napisy czasowe,
- tekst lektorski,
- opis,
- CTA,
- dokładnie 5 hashtagów.

Jeśli format to "Stories":
przygotuj krótką serię Stories możliwą do nagrania bez pokazywania twarzy.

Jeśli format to "Karuzela":
przygotuj 6 slajdów:
1. Hook
2. O czym jest książka — tylko na podstawie dostępnych danych
3. Największa zaleta wynikająca z opinii użytkowniczki
4. Element, który może nie spodobać się każdemu
5. Dla kogo
6. Ocena i jedno pytanie

Jeśli format to "Hashtagi":
zwróć dokładnie 5 trafnych hashtagów.

Pisz po polsku.
Zwróć wyłącznie gotową treść dla użytkowniczki.
`;

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },

        body: JSON.stringify({
          model: "gpt-5.6-luna",
          input: prompt
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {

      console.error("OpenAI error:", result);

      return {
        statusCode: response.status,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error:
            result?.error?.message ||
            "OpenAI zwróciło błąd."
        })
      };
    }

    let text = "";

    if (result.output_text) {
      text = result.output_text;
    }

    if (!text && Array.isArray(result.output)) {

      for (const item of result.output) {

        if (!Array.isArray(item.content)) continue;

        for (const content of item.content) {

          if (
            content.type === "output_text" &&
            content.text
          ) {
            text += content.text;
          }
        }
      }
    }

    if (!text) {
      text = "AI nie zwróciło tekstu. Spróbuj ponownie.";
    }

    return {
      statusCode: 200,

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        text: text
      })
    };

  } catch (error) {

    console.error(error);

    return {
      statusCode: 500,

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        error: "Błąd funkcji Karolcia AI."
      })
    };
  }
};