import { GoogleGenAI, Type } from "@google/genai";
import type { Question } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            question: {
                type: Type.STRING,
                description: "Nội dung câu hỏi trắc nghiệm."
            },
            options: {
                type: Type.ARRAY,
                items: {
                    type: Type.STRING,
                },
                description: "Một mảng chứa 4 lựa chọn trả lời."
            },
            correctAnswerIndex: {
                type: Type.INTEGER,
                description: "Chỉ số (index) của câu trả lời đúng trong mảng options (bắt đầu từ 0)."
            },
            explanation: {
                type: Type.STRING,
                description: "Giải thích ngắn gọn, rõ ràng tại sao đáp án đó là đúng."
            },
            difficulty: {
                type: Type.STRING,
                description: "Mức độ của câu hỏi, phải là một trong các giá trị: 'Nhận biết', 'Thông hiểu', 'Vận dụng'."
            }
        },
        required: ['question', 'options', 'correctAnswerIndex', 'explanation', 'difficulty'],
    },
};


export const generateQuestions = async (subject: string, grade: string, topic: string, numQuestions: Record<string, number>): Promise<Question[]> => {
    try {
        const prompt = `
            Với vai trò là một chuyên gia giáo dục, hãy tạo một bộ câu hỏi trắc nghiệm khách quan về chủ đề '${topic}' cho môn học '${subject}', cấp Trung học cơ sở, lớp ${grade} tại Việt Nam.

            Yêu cầu về số lượng và mức độ khó:
            - ${numQuestions['Nhận biết']} câu ở mức độ 'Nhận biết': câu hỏi đơn giản, kiểm tra định nghĩa hoặc công thức.
            - ${numQuestions['Thông hiểu']} câu ở mức độ 'Thông hiểu': yêu cầu giải thích, suy luận nhẹ.
            - ${numQuestions['Vận dụng']} câu ở mức độ 'Vận dụng': yêu cầu tính toán hoặc liên hệ thực tế.

            Yêu cầu chung cho mỗi câu hỏi:
            1. Phải có 4 lựa chọn (A, B, C, D).
            2. Chỉ có một đáp án duy nhất đúng.
            3. Nội dung câu hỏi và các lựa chọn phải rõ ràng, phù hợp với kiến thức và trình độ của học sinh lớp ${grade}.
            4. Các lựa chọn nhiễu phải hợp lý.
            5. Với mỗi câu hỏi, cung cấp một giải thích ngắn gọn và rõ ràng cho đáp án đúng.
            6. Gắn đúng nhãn mức độ ('Nhận biết', 'Thông hiểu', 'Vận dụng') cho mỗi câu hỏi.
            7. Đảm bảo câu trả lời được cung cấp theo đúng định dạng JSON đã yêu cầu.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.7,
            },
        });
        
        const jsonText = response.text.trim();
        const generatedQuestions: Question[] = JSON.parse(jsonText);

        // Basic validation
        if (!Array.isArray(generatedQuestions)) {
            throw new Error("API did not return a valid array of questions.");
        }
        
        // Return empty array if API returns empty for 0 questions requested
        if (generatedQuestions.length === 0 && Object.values(numQuestions).reduce((a, b) => a + b, 0) === 0) {
            return [];
        }

        if (generatedQuestions.length === 0) {
             throw new Error("API returned an empty array of questions.");
        }
        
        return generatedQuestions;

    } catch (error) {
        console.error("Error generating questions with Gemini:", error);
        throw new Error("Failed to parse questions from AI response.");
    }
};
