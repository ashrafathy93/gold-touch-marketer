import { GoogleGenAI } from '@google/genai';

export const config = {
  maxDuration: 60,
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { imageBase64, config: jewelryConfig, customNotes } = req.body;
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in Vercel environment variables.' });
    }

    const ai = new GoogleGenAI({ apiKey });

    let promptParts: string[] = [];
    promptParts.push("Act as a world-class luxury jewelry designer and high-end commercial jewelry photographer.");
    promptParts.push("Generate an ultra-realistic, breathtaking, 8k resolution marketing-ready hero photo of this jewelry creation.");
    
    if (jewelryConfig) {
      promptParts.push(`- Jewelry Type: ${jewelryConfig.jewelryType}`);
      promptParts.push(`- Primary Metal: ${jewelryConfig.metal}`);
      if (jewelryConfig.selectedStones && jewelryConfig.selectedStones.length > 0) {
        if (jewelryConfig.selectedStones.includes('No Stone')) {
          promptParts.push(`- Stones: Plain polished metal design without gemstones.`);
        } else {
          promptParts.push(`- Gemstones: ${jewelryConfig.selectedStones.join(', ')}`);
          if (jewelryConfig.stoneDetails) {
            Object.values(jewelryConfig.stoneDetails).forEach((sd: any) => {
              promptParts.push(`  * ${sd.cut}: Weight/Carat: ${sd.caratOrWeight || 'Optimal'}, Count: ${sd.count || 'As designed'}, Placement: ${sd.placement || 'Harmonious'}`);
            });
          }
        }
      }
      promptParts.push(`- Scale & Proportions: ${jewelryConfig.scale} (${jewelryConfig.sizingMethod})`);
      if (jewelryConfig.engravingStamp) {
        promptParts.push(`- Hallmark / Stamp: Discrete elegant engraving "${jewelryConfig.engravingStamp}" integrated on internal surface.`);
      }
    }

    if (customNotes) {
      promptParts.push(`- Custom Creative Concept & Motifs (including symbolic emojis): "${customNotes}". Interpret these notes artistically into the design and artistic presentation.`);
    }

    promptParts.push("- Background & Lighting Directive: The background must be created with full artistic freedom, intelligence, and understanding of the piece. If the design includes flowers, hearts, or specific themes, seamlessly weave subtle luxury artistic elements into the background environment.");
    promptParts.push("- Focus & Focal Depth: Apply a heavy shallow depth-of-field blur (bokeh) to the background to ensure absolute razor-sharp focus and dramatic spotlighting on the jewelry product itself.");

    const finalPrompt = promptParts.join("\n");

    let contents: any[] = [];
    if (imageBase64) {
      const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
      contents.push({
        role: 'user',
        parts: [
          { text: finalPrompt },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64
            }
          }
        ]
      });
    } else {
      contents.push({
        role: 'user',
        parts: [{ text: finalPrompt }]
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        temperature: 0.7,
      }
    });

    const textOutput = response.text || '';
    
    return res.status(200).json({ 
      success: true, 
      resultImage: textOutput,
      promptUsed: finalPrompt
    });

  } catch (err: any) {
    console.error('API Error:', err);
    return res.status(500).json({ 
      error: err.message || 'حدث خطأ غير متوقع أثناء المعالجة.',
      details: err.toString() 
    });
  }
}