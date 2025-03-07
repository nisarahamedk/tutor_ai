from typing import Dict

class PreAssessmentAgent:
    def __init__(self):
        self.common_questions = [
            "How much time can you dedicate to learning per week?",
            "What is your preferred learning style (hands-on, reading, video tutorials)?"
        ]

    def get_subject_specific_questions(self, subject: str) -> list:
        if "python" in subject.lower():
            return [
                "Have you done any programming before?",
                "What is your goal with learning Python?",
                "Do you have any specific areas of interest (web development, data science, etc.)?"
            ]
        else:
            return [
                f"I see you want to learn {subject}. Could you tell me about your current experience level?",
                "What are your main goals for learning this subject?",
                "Do you have any specific areas of interest within this subject?"
            ]

    async def assess(self, learning_request: str) -> Dict:
        # This is a mock implementation
        # In reality, this would use an LLM to generate appropriate assessment questions
        subject_questions = self.get_subject_specific_questions(learning_request)
        return {
            "questions": subject_questions + self.common_questions
        }
