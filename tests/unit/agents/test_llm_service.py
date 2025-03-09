import pytest
from unittest.mock import AsyncMock, patch
from agents.llm_service import LLMService

@pytest.fixture
def llm_service():
    return LLMService()

@pytest.mark.asyncio
async def test_generate_assessment_questions_basic():
    """Test basic question generation without LLM integration."""
    service = LLMService()
    questions = await service.generate_assessment_questions("I want to learn Python")
    
    assert isinstance(questions, list)
    assert len(questions) >= 3
    assert all(isinstance(q, str) for q in questions)
    assert all(q.endswith("?") for q in questions)
    assert any("Python" in q for q in questions)

@pytest.mark.asyncio
@patch('agents.llm_service.openai.AsyncOpenAI')
async def test_generate_assessment_questions_with_openai(mock_openai):
    """Test question generation with OpenAI integration."""
    # Mock OpenAI response
    mock_client = AsyncMock()
    mock_client.chat.completions.create.return_value.choices[0].message.content = """
    1. What is your current level of programming experience?
    2. Have you worked with object-oriented languages before?
    3. What specific Python applications interest you?
    4. Do you have any experience with development tools like Git?
    """
    mock_openai.return_value = mock_client
    
    service = LLMService(use_openai=True)
    questions = await service.generate_assessment_questions("I want to learn Python")
    
    # Verify OpenAI was called with correct parameters
    mock_client.chat.completions.create.assert_called_once()
    call_args = mock_client.chat.completions.create.call_args[1]
    assert call_args["model"] == "gpt-3.5-turbo"
    assert any("Python" in msg["content"] for msg in call_args["messages"])
    assert any("assessment questions" in msg["content"] for msg in call_args["messages"])
    
    # Verify response processing
    assert isinstance(questions, list)
    assert len(questions) >= 3
    assert "programming experience" in " ".join(questions)

@pytest.mark.asyncio
@patch('agents.llm_service.openai.AsyncOpenAI')
async def test_openai_error_handling(mock_openai):
    """Test fallback behavior when OpenAI API fails."""
    # Mock OpenAI to raise an exception
    mock_client = AsyncMock()
    mock_client.chat.completions.create.side_effect = Exception("API Error")
    mock_openai.return_value = mock_client
    
    service = LLMService(use_openai=True)
    questions = await service.generate_assessment_questions("I want to learn Python")
    
    # Should fall back to template-based questions
    assert isinstance(questions, list)
    assert len(questions) >= 3
    assert any("Python" in q for q in questions)

@pytest.mark.asyncio
async def test_question_relevance():
    """Test that questions are relevant to the learning request."""
    service = LLMService()
    
    # Test different subjects
    ml_questions = await service.generate_assessment_questions("I want to learn Machine Learning")
    web_questions = await service.generate_assessment_questions("I want to learn Web Development")
    
    # ML questions should mention ML-related terms
    ml_terms = ["machine learning", "ml", "ai", "statistics", "data"]
    assert any(any(term in q.lower() for term in ml_terms) for q in ml_questions)
    
    # Web questions should mention web-related terms
    web_terms = ["web", "frontend", "backend", "html", "javascript"]
    assert any(any(term in q.lower() for term in web_terms) for q in web_questions)

@pytest.mark.asyncio
async def test_question_format():
    """Test the format of generated questions."""
    service = LLMService()
    questions = await service.generate_assessment_questions("I want to learn Python")
    
    for question in questions:
        # Each question should be properly formatted
        assert isinstance(question, str)
        assert len(question.strip()) > 0
        assert question.endswith("?")
        assert not question.startswith("1.") # Should not include numbering
        assert not question.startswith("-") # Should not include bullet points