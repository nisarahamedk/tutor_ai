from typing import List, Optional, Dict
import logging
import os
from smolagents import CodeAgent, LiteLLMModel

class LLMService:
    """Service for interacting with Language Learning Models using smolagents."""
    
    def __init__(self, model_name: str = "mistral"):
        self.logger = logging.getLogger(__name__)
        self.llm = LiteLLMModel(
            model_id=f"ollama/{model_name}",
            temperature=0.7  # Add some creativity for question generation
        )
        
        # Define prompt templates for the agent
        prompt_templates = {
            "system_prompt": """You are an expert tutor who helps assess students' learning needs.
            When generating assessment questions:
            1. Make them specific to the subject
            2. Progress from basic to more specific topics
            3. Focus on understanding background and goals
            4. Each question should be clear and end with a question mark
            5. Do not include numbering or bullet points
            6. Return exactly 4-5 questions
            
            You will write Python code that returns the questions. Example:
            ```python
            questions = [
                "What is your current level of experience in this subject?",
                "Have you studied any related topics before?",
                "What specific aspects interest you most?",
                "What are your goals for learning this subject?"
            ]
            final_answer(questions)
            ```

            Above example was using notional tools that might not exist for you. On top of performing computations in the Python code snippets that you create, you only have access to these tools:
            {%- for tool in tools.values() %}
            - {{ tool.name }}: {{ tool.description }}
                Takes inputs: {{tool.inputs}}
                Returns an output of type: {{tool.output_type}}
            {%- endfor %}

            Here are the rules you should always follow to solve your task:
            1. Always provide a 'Thought:' sequence, and a 'Code:\n```py' sequence ending with '```<end_code>' sequence, else you will fail.
            2. Use only variables that you have defined!
            3. Always use the right arguments for the tools.
            4. Take care to not chain too many sequential tool calls in the same code block.
            5. Call a tool only when needed.
            6. Don't name any new variable with the same name as a tool.
            7. Never create any notional variables in our code.
            8. You can use imports in your code, but only from the following list of modules: {{authorized_imports}}
            9. The state persists between code executions.
            10. Don't give up! You're in charge of solving the task, not providing directions to solve it.

            Now Begin! If you solve the task correctly, you will receive a reward of $1,000,000.""",
            "final_answer": {
                "post_messages": """Based on the above, please provide an answer to the following user task:
                {{task}}
                
                Remember to return exactly 4-5 relevant assessment questions that will help understand the student's needs."""
            }
        }
        
        self.agent = CodeAgent(
            name="TutorAgent",
            model=self.llm,
            tools=[],  # No additional tools needed for question generation
            add_base_tools=False,  # We don't need any base tools for question generation
            prompt_templates=prompt_templates
        )
    

    async def generate_assessment_questions(self, learning_request: str) -> List[str]:
        """Generate assessment questions based on the learning request.
        
        Args:
            learning_request: The user's learning request (e.g., "I want to learn Python")
            
        Returns:
            List of relevant assessment questions
            
        Raises:
            Exception: If there's an error communicating with the LLM service
        """
        try:
            prompt = f"""A student has said: "{learning_request}"
            Generate 4-5 relevant assessment questions to understand their current knowledge level, 
            learning goals, and specific interests in this subject.
            
            Write Python code that returns the questions using final_answer()."""
            
            # Get response from the agent
            result = await self.agent.run(prompt)
            
            # Validate we got enough questions
            if not isinstance(result, list) or len(result) < 3:
                self.logger.warning("LLM returned invalid response or too few questions, falling back to templates")
                return self._get_template_questions(learning_request)
                
            return result
            
        except Exception as e:
            self.logger.error(f"Failed to generate questions using LLM: {e}")
            return self._get_template_questions(learning_request)
            
    def _get_template_questions(self, learning_request: str) -> List[str]:
        """Fallback method to generate template-based questions."""
        self.logger.info("Using template-based questions")
        subject = learning_request.lower()
        
        if "python" in subject:
            return [
                "What is your current level of programming experience?",
                "Have you used any programming languages before Python?",
                "What specific Python applications interest you (web, data science, automation)?",
                "Do you have any specific Python libraries or frameworks in mind?"
            ]
        elif "machine learning" in subject or "ml" in subject:
            return [
                "What is your background in AI and statistics?",
                "Have you worked with any ML frameworks before?",
                "What specific ML applications interest you?",
                "Are you familiar with Python, as it's commonly used in ML?"
            ]
        elif "web" in subject:
            return [
                "Are you more interested in frontend or backend development?",
                "Have you worked with HTML, CSS, or JavaScript before?",
                "Which web frameworks are you interested in learning?",
                "Do you have experience with any web technologies?"
            ]
        else:
            return [
                f"What is your current knowledge level in {learning_request}?",
                "What specific aspects of this subject interest you most?",
                "How do you plan to apply this knowledge?",
                "What learning resources have you tried before?"
            ]