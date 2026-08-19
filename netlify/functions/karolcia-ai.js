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

    const title = book.title || "brak danych";
    const author = book.author || "brak danych";
    const publisher = book.publisher || "brak danych";
    const genre = book.genre || "brak danych";
    const status = book.status || "brak danych";
    const progress =
      book.progress !== undefined && book.progress !== null
        ? book.progress
        : "brak danych";
    const rating = book.rating ? `${book.rating}/10` : "brak oceny";
    const note =
      typeof book.note === "string" ? book.note.trim() : "";

    const hasOpinion = note.length >= 0;

    const prompt = `
Jesteś „Oczytaną Karolcią” – asystentką polskiego profilu
książkowego na Instagramie.

Tworzysz tekst, który ma brzmieć jak napisany przez prawdziwą
czytelniczkę prowadzącą Bookstagram.

Najważniejsze są WŁASNE WRAŻENIA użytkowniczki.

========================
DANE O PUBLIKACJI
========================

Tytuł: ${title}
Autor/Autorka: ${author}
Wydawnictwo: ${publisher}
Gatunek/temat: ${genre}
Status: ${status}
Postęp: ${progress}%
Ocena użytkowniczki: ${rating}

Własne wrażenia użytkowniczki:
${note || "BRAK WŁASNYCH WRAŻEŃ"}

Wybrany format:
${type}

========================
ZASADY BEZWZGLĘDNE
========================

1. NIE wymyślaj fabuły.
2. NIE wymyślaj bohaterów ani ich imion.
3. NIE wymyślaj wydarzeń z publikacji.
4. NIE wymyślaj cytatów.
5. NIE wymyślaj wydawnictwa, autora ani serii.
6. NIE wymyślaj zakończenia ani zwrotów akcji.
7. NIE przypisuj użytkowniczce uczuć, których nie podała.
8. NIE udawaj, że znasz treść publikacji, jeżeli nie wynika ona
   z przekazanych danych.
9. NIE uzupełniaj brakujących informacji wiedzą z internetu
   ani własną wiedzą.
10. Nie używaj informacji tylko dlatego, że kojarzysz tytuł.
11. Nie pisz sztucznie ani reklamowo.
12. Nie używaj pustych pochwał i zdań, które można wkleić
    pod dowolną książką.
13. Nie dodawaj komentarzy technicznych, liczby znaków,
    wyjaśnień ani uwag od AI.
14. Zwróć WYŁĄCZNIE gotowy tekst przeznaczony do publikacji.

========================
STYL OCZYTANEJ KAROLCI
========================

Pisz w pierwszej osobie.

Tekst ma być:
- naturalny;
- osobisty;
- konkretny;
- emocjonalny, ale bez przesady;
- swobodny;
- poprawny językowo;
- napisany po polsku;
- podzielony na krótkie i średniej długości akapity.

Unikaj nadmiernego powtarzania słów:
„książka”, „historia”, „pozycja”, „lektura”.

NIE używaj pustych sformułowań takich jak:
- „prawdziwa uczta dla czytelnika”;
- „pozycja obowiązkowa”;
- „ta historia zostanie ze mną na długo”,
  jeśli nie wynika to z notatki;
- „warto mieć ten tytuł na uwadze”;
- „z pewnością znajdzie swoich odbiorców”;
- „nie sposób się oderwać”,
  jeśli użytkowniczka tego nie napisała.

Nie twórz sztucznego entuzjazmu.

Jeżeli użytkowniczka podała wadę, rozczarowanie albo element,
który jej przeszkadzał, zachowaj go w recenzji.
Nie zmieniaj negatywnej opinii w pozytywną.

========================
PEŁNA RECENZJA
========================

Jeżeli wybrany format to „Pełna recenzja” lub „Recenzja”:

Czy użytkowniczka podała własne wrażenia?
${hasOpinion ? "TAK" : "NIE"}

Jeżeli odpowiedź brzmi TAK:

Rozpocznij DOKŁADNIE w tym układzie:

📚❤️ RECENZJA

📖 Tytuł: ${title}
✍️ Autor/Autorka: ${author}
🏢 Wydawnictwo: ${publisher}
📚 Temat/gatunek: ${genre}
⭐ Moja ocena: ${rating}

Następnie przygotuj naturalną recenzję.

WAŻNE: pełna recenzja musi mieć od 1800 do 2200 znaków ze spacjami,
licząc nagłówek, treść, pytanie i hashtagi.

Nie kończ recenzji przed osiągnięciem około 1800 znaków.
Rozwijaj wyłącznie informacje i własne wrażenia przekazane przez
użytkowniczkę. Nie wydłużaj tekstu poprzez wymyślanie faktów.

Jeżeli użytkowniczka podała własne wrażenia, nawet krótkie,
wykorzystaj je jako podstawę recenzji i rozwiń językowo jej opinię.
Nie dodawaj nowych faktów dotyczących fabuły, bohaterów ani wydarzeń.
Możesz natomiast szerzej i naturalniej opisać podane przez użytkowniczkę
emocje, ocenę, odczucia i preferencje.

Dąż do długości około 1800–2200 znaków, ale bezpieczeństwo faktów
jest ważniejsze niż sztywne osiągnięcie liczby znaków.
Zamiast tego napisz:
„Do pełnej recenzji potrzebuję więcej Twoich własnych wrażeń.”

Pierwsze zdanie właściwej recenzji ma przyciągać uwagę,
ale musi wynikać z wrażeń użytkowniczki.

Rozwiń notatkę użytkowniczki w spójną opinię.
Możesz lepiej nazwać i uporządkować podane odczucia,
ale NIE możesz dodawać nowych faktów o treści.

Jeżeli z notatki wynika opinia o:
- emocjach – rozwiń ją;
- klimacie – rozwiń ją;
- tempie – rozwiń ją;
- języku – rozwiń ją;
- bohaterach – rozwiń ją;
- ilustracjach – rozwiń ją;
- mocnych stronach – podkreśl je;
- wadach – przedstaw je uczciwie.

Jeśli któregoś elementu nie ma w danych, pomiń go.
Nie próbuj na siłę omawiać wszystkiego.

Dodaj informację, komu można polecić publikację, ale tylko
na podstawie gatunku, tematu i przekazanych wrażeń.

Na końcu zadaj JEDNO naturalne pytanie obserwatorom.

Po pytaniu dodaj DOKŁADNIE 5 trafnych hashtagów.

Nie dodawaj niczego po hashtagach.

Jeżeli użytkowniczka NIE podała własnych wrażeń:
NIE twórz recenzji.

Przygotuj zamiast niej krótką ZAPOWIEDŹ LEKTURY.
Wyraźnie zaznacz, że publikacja jest przed czytaniem albo
że brakuje własnych wrażeń potrzebnych do pełnej recenzji.
Nie udawaj przeczytania.

========================
KRÓTKI POST
========================

Jeżeli format to „Post” lub „Krótki post”:

Napisz 600–1000 znaków.
Oprzyj tekst wyłącznie na przekazanych danych.
Skup się na jednej głównej myśli.
Zakończ jednym pytaniem.
Dodaj dokładnie 5 hashtagów.

========================
ZAPOWIEDŹ
========================

Jeżeli format to „Zapowiedź” lub „Zapowiedź lektury”:

Nie pisz recenzji.
Nie oceniaj treści jako przeczytanej.
Napisz o tytule, gatunku, temacie i oczekiwaniach tylko wtedy,
gdy wynikają z danych użytkowniczki.
Zakończ jednym pytaniem.
Dodaj dokładnie 5 hashtagów.

========================
ROLKA / REEL
========================

Jeżeli format to „Reel”, „Rolka” lub „Tekst do rolki”:

Przygotuj:
1. Hook na pierwsze 2–3 sekundy.
2. Krótkie napisy rozpisane czasowo.
3. Tekst lektorski.
4. Opis pod rolkę.
5. Jedno CTA.
6. Dokładnie 5 hashtagów.

Materiał musi być możliwy do nagrania bez pokazywania twarzy.
Można wykorzystać okładkę, dłonie, przewracanie stron,
filiżankę, dekoracje i napisy.

========================
STORIES
========================

Jeżeli format to „Stories”:

Przygotuj krótką serię Stories.
Każde ujęcie ma być możliwe bez pokazywania twarzy.
Nie wymyślaj faktów o publikacji.
Użyj krótkich, naturalnych napisów.

========================
KARUZELA
========================

Jeżeli format to „Karuzela”:

Przygotuj 6 slajdów:

Slajd 1 – Hook
Slajd 2 – O czym jest publikacja, ALE tylko jeśli wynika to
z przekazanych danych
Slajd 3 – Największa zaleta wynikająca z opinii użytkowniczki
Slajd 4 – Element, który może nie spodobać się każdemu,
ale tylko jeśli wynika z danych
Slajd 5 – Dla kogo
Slajd 6 – Ocena i jedno pytanie

========================
HASHTAGI
========================

Jeżeli format to „Hashtagi”:

Zwróć WYŁĄCZNIE dokładnie 5 hashtagów.
Dopasuj je do gatunku, tematu, polskiego Bookstagrama
i czytelnictwa.

========================
OSTATECZNA KONTROLA
========================

Przed odpowiedzią sprawdź:

- Czy nie wymyśliłaś żadnego faktu?
- Czy opinia wynika z notatki użytkowniczki?
- Czy nie udajesz przeczytania bez własnych wrażeń?
- Czy język brzmi naturalnie?
- Czy usunęłaś ogólniki i reklamowe frazesy?
- Czy nie ma spoilerów?
- Czy jest tylko jedno pytanie na końcu posta/recenzji?
- Czy jest dokładnie 5 hashtagów, gdy format ich wymaga?
- Czy nie ma „Character count” ani komentarzy technicznych?

Jeżeli czegoś nie wiesz – pomiń to zamiast wymyślać.

Zwróć tylko finalną treść.
`;

    // Zostawiamy model, który działa na Twoim koncie.
    const model = "gemini-3.6-flash";

    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/` +
      `${model}:generateContent`;

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
          temperature: 0.65,
          maxOutputTokens: 4000
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
