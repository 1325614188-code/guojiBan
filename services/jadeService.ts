import { API_BASE } from "../lib/config";
import { JadeAnalysisResult } from "../types";

export async function analyzeJadeImages(images: string[], lang: string): Promise<JadeAnalysisResult> {
    const response = await fetch(`${API_BASE}/api/gemini`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'jadeAppraisal',
            images,
            lang
        })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `Appraisal failed: ${response.status}`);
    }

    const { result } = await response.json();

    if (result.error) {
        throw new Error(result.error);
    }

    return result;
}
