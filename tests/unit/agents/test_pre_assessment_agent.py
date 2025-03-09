import pytest
from unittest.mock import AsyncMock, patch
from agents.pre_assessment_agent import PreAssessmentAgent

@pytest.fixture
def agent():
    return PreAssessmentAgent()

@pytest.fixture
def mock_llm():
    return AsyncMock()

@pytest.mark.asyncio
async def test_assess_python_learning_request(agent):
    """Test assessment for Python learning request."""
    result = await agent.assess("I want to learn Python")
    questions = result["questions"]
    
    # Basic structure checks
    assert isinstance(questions, list)
    assert len(questions) >= 3
    
    # Content checks
    python_keywords = ["programming", "python", "experience", "goal"]
    assert any(any(keyword in q.lower() for keyword in python_keywords) for q in questions)

@pytest.mark.asyncio
async def test_assess_custom_subject(mock_llm):
    """Test assessment for a non-Python subject."""
    mock_llm.generate_assessment_questions.return_value = [
        "What is your current knowledge of Machine Learning?",
        "Have you studied statistics or mathematics?",
        "Which Machine Learning topics interest you most?"
    ]
    agent = PreAssessmentAgent(llm_service=mock_llm)
    
    result = await agent.assess("I want to learn Machine Learning")
    questions = result["questions"]
    
    assert isinstance(questions, list)
    assert len(questions) >= 3
    assert "Machine Learning" in " ".join(questions)

@pytest.mark.asyncio
async def test_llm_integration(mock_llm):
    """Test integration with LLM service for dynamic question generation."""
    # Setup mock LLM response
    mock_llm.generate_assessment_questions.return_value = [
        "What is your background in AI and statistics?",
        "Have you worked with any ML frameworks before?",
        "What specific ML applications interest you?"
    ]
    
    agent = PreAssessmentAgent(llm_service=mock_llm)
    result = await agent.assess("I want to learn Machine Learning")
    questions = result["questions"]
    
    # Verify LLM was called correctly
    mock_llm.generate_assessment_questions.assert_called_once_with(
        "I want to learn Machine Learning"
    )
    
    # Verify response structure
    assert isinstance(questions, list)
    assert len(questions) >= 3
    assert any("ML frameworks" in q for q in questions)

@pytest.mark.asyncio
async def test_llm_failure_fallback(mock_llm):
    """Test fallback behavior when LLM service fails."""
    # Setup mock LLM to raise an exception
    mock_llm.generate_assessment_questions.side_effect = Exception("LLM service error")
    
    agent = PreAssessmentAgent(llm_service=mock_llm)
    result = await agent.assess("I want to learn Machine Learning")
    questions = result["questions"]
    
    # Should fall back to template-based questions
    assert isinstance(questions, list)
    assert len(questions) >= 3
    # Check for template fallback questions
    assert any("current experience level" in q.lower() for q in questions)

@pytest.mark.asyncio
async def test_assess_response_format(agent):
    """Test the structure and format of the assessment response."""
    result = await agent.assess("I want to learn Python")
    
    # Check response structure
    assert isinstance(result, dict)
    assert "questions" in result
    assert isinstance(result["questions"], list)
    
    # Check question format
    for question in result["questions"]:
        assert isinstance(question, str)
        assert len(question.strip()) > 0
        assert question.endswith("?")

@pytest.mark.asyncio
async def test_assess_empty_input(agent):
    """Test handling of empty or invalid input."""
    with pytest.raises(ValueError) as exc_info:
        await agent.assess("")
    assert "learning request cannot be empty" in str(exc_info.value).lower()

@pytest.mark.asyncio
async def test_assess_maintains_context(agent):
    """Test that assessment maintains context across questions."""
    result = await agent.assess("I want to learn Python for web development")
    questions = result["questions"]
    
    # Should have questions relevant to web development
    web_dev_keywords = ["web", "development", "framework", "backend", "frontend"]
    assert any(any(keyword in q.lower() for keyword in web_dev_keywords) for q in questions)