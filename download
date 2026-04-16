import { GoogleGenAI, Type } from "@google/genai";

export interface GoogleBook {
  id: string;
  isAIGenerated?: boolean;
  volumeInfo: {
    title: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;
    description?: string;
    summary?: string;
    audience?: string;
    ageRating?: string;
    categories?: string[];
    pageCount?: number;
    industryIdentifiers?: {
      type: string;
      identifier: string;
    }[];
    imageLinks?: {
      thumbnail: string;
    };
    averageRating?: number;
    ratingsCount?: number;
    language?: string;
    previewLink?: string;
  };
}

export async function searchGlobalBooks(query: string, maxResults: number = 20): Promise<GoogleBook[]> {
  if (!query.trim()) return [];
  
  try {
    console.log(`Searching AI Global Hub for: ${query}`);
    const aiResults = await geminiSearchFallback(query, maxResults);
    return aiResults || [];
  } catch (error) {
    console.error('Global AI Search Error:', error);
    return [];
  }
}

export async function searchBhavansBooks(maxResults: number = 20): Promise<GoogleBook[]> {
  try {
    console.log(`Fetching Bharatiya Vidya Bhavan (bhavans.info) collection...`);
    const aiResults = await geminiSearchFallback("books published by Bharatiya Vidya Bhavan bhavans.info", maxResults);
    return aiResults || [];
  } catch (error) {
    console.error('Bhavans Search Error:', error);
    return [];
  }
}

async function geminiSearchFallback(query: string, maxResults: number): Promise<GoogleBook[] | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Gemini API key not configured for AI Hub");
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Search for real books matching the query: "${query}". 
      Focus on finding books that are popular or available on platforms like Kindle and Goodreads.
      For each book, you MUST provide:
      1. A compelling, detailed description (full overview).
      2. A concise summary (approx 200 characters).
      3. A note on "Who will like this" (target audience/themes).
      4. An appropriate age rating (e.g., General, Young Adult, Mature).
      5. The ISBN-13 if available.
      Return up to ${maxResults} items.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  volumeInfo: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      authors: { type: Type.ARRAY, items: { type: Type.STRING } },
                      description: { type: Type.STRING },
                      summary: { type: Type.STRING },
                      audience: { type: Type.STRING },
                      ageRating: { type: Type.STRING },
                      categories: { type: Type.ARRAY, items: { type: Type.STRING } },
                      industryIdentifiers: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            type: { type: Type.STRING },
                            identifier: { type: Type.STRING }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    const dataText = response.text;
    try {
      const data = JSON.parse(dataText);
      if (data.items) {
        return data.items.map((item: any) => {
          const isbn13 = item.volumeInfo.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13')?.identifier;
          const isbn10 = item.volumeInfo.industryIdentifiers?.find((id: any) => id.type === 'ISBN_10')?.identifier;
          const isbn = isbn13 || isbn10;
          
          let coverUrl = `https://picsum.photos/seed/${encodeURIComponent(item.volumeInfo.title)}/400/600`;
          if (isbn) {
            coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`;
          }

          return {
            ...item,
            isAIGenerated: true,
            volumeInfo: {
              ...item.volumeInfo,
              imageLinks: {
                thumbnail: coverUrl
              }
            }
          };
        });
      }
    } catch (parseError) {
      console.error("Failed to parse Gemini JSON response:", parseError);
      console.log("Raw response length:", dataText.length);
      // If it's a truncation error, we might try to find the last complete item, 
      // but for now, we'll just return null to trigger the error UI
    }
  } catch (error) {
    console.error("Gemini fallback error:", error);
  }
  return null;
}

export async function getGlobalBookById(id: string): Promise<GoogleBook | null> {
  // Since we removed Google Books, we'll just return null or handle it as a local book
  // In a real app, we might search the AI results again or store them
  return null;
}
