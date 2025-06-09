from typing import Dict, List
import logging
from app.agents.llm_service import LLMService

class PreAssessmentAgent:
    def __init__(self, llm_service: LLMService = None):
        self.logger = logging.getLogger(__name__)
        self.llm_service = llm_service or LLMService()
        self.common_questions = [
            "How much time can you dedicate to learning per week?",
            "What is your preferred learning style (hands-on, reading, video tutorials)?"
        ]

    def get_subject_specific_questions(self, subject: str) -> List[str]:
        """Fallback method for generating questions when LLM service fails."""
        if not subject:
            raise ValueError("Subject cannot be empty")
            
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
        """Generate assessment questions for the learning request.
        
        Args:
            learning_request: The user's learning request (e.g., "I want to learn Python")
            
        Returns:
            Dict containing list of assessment questions
            
        Raises:
            ValueError: If learning_request is empty
        """
        if not learning_request or not learning_request.strip():
            raise ValueError("Learning request cannot be empty")
            
        try:
            # Try to get questions from LLM service
            subject_questions = await self.llm_service.generate_assessment_questions(learning_request)
        except Exception as e:
            # Log the error and fall back to template-based questions
            self.logger.error(f"LLM service failed: {e}. Falling back to templates.")
            subject_questions = self.get_subject_specific_questions(learning_request)
            
        return {
            "questions": subject_questions + self.common_questions
        }
