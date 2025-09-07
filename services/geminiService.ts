import { GoogleGenAI, Modality } from "@google/genai";
import { Sprite } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const basePromptEnhancer = `The output MUST be a single, isolated character sprite on a solid magenta background (color #FF00FF). The background must be pure, solid magenta. Do not include any text, labels, or other elements in the image.`;

const extractImageBase64 = (response: any): string => {
    const imagePart = response.candidates?.[0]?.content?.parts?.find((part: any) => part.inlineData);
    if (imagePart && imagePart.inlineData.data) {
        return imagePart.inlineData.data;
    }
    throw new Error('No image data found in the API response.');
};

const imageToBase64Part = (base64Data: string, mimeType: string = 'image/png') => {
    const data = base64Data.startsWith('data:') ? base64Data.split(',')[1] : base64Data;
    return {
        inlineData: {
            data,
            mimeType,
        },
    };
};

export const generateDesignName = async (prompt: string): Promise<string> => {
    const fullPrompt = `Generate a very short, cool, and memorable name (2-3 words max) for a game character based on the following description. Return only the name, with no extra text or quotes.\n\nDescription: "${prompt}"`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: fullPrompt,
    });
    return response.text.trim().replace(/"/g, '');
};

export const generateBaseCharacter = async (
    prompt: string,
    contextImage: { mimeType: string; data: string } | null,
    spriteSize: number
): Promise<string> => {
    const specialInstructions = `Perspective is top-down facing front. The character should fill the frame as much as possible. If the character has feet, they should touch the bottom border of the image. The sprite should have the appearance of a ${spriteSize}x${spriteSize} pixel art character.`;
    const fullPrompt = `${prompt}. ${specialInstructions} ${basePromptEnhancer}`;
    
    const parts = [];
    if (contextImage) {
        parts.push(imageToBase64Part(contextImage.data, contextImage.mimeType));
    }
    parts.push({ text: fullPrompt });
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });

    return extractImageBase64(response);
};


export const generateSprite = async (
    prompt: string,
    contextImages: { mimeType: string; data: string }[],
    spriteSize: number
): Promise<string> => {
    const fullPrompt = `${prompt}. ${basePromptEnhancer} The sprite should have the appearance of a ${spriteSize}x${spriteSize} pixel art character.`;
    
    const parts = [
        ...contextImages.map(img => imageToBase64Part(img.data, img.mimeType)),
        { text: fullPrompt },
    ];
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });

    return extractImageBase64(response);
};

export const editSprite = async (
    editPrompt: string,
    targetSprite: Sprite,
    contextSprites: Sprite[],
    spriteSize: number
): Promise<string> => {
    const fullPrompt = `Edit the primary input image based on this instruction: "${editPrompt}". The sprite must maintain the appearance of a ${spriteSize}x${spriteSize} pixel art style. Use the other images as context for the character's consistent design. ${basePromptEnhancer}`;
    
    const parts = [
        imageToBase64Part(targetSprite.imageUrl), // Primary image to edit
        ...contextSprites.map(sprite => imageToBase64Part(sprite.imageUrl)),
        { text: fullPrompt }
    ];

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });

    return extractImageBase64(response);
};