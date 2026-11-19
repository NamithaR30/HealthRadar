
from fastapi import APIRouter, HTTPException

from app.schemas import NLPParseRequest, NLPParseResponse
from app.ml.nlp_assistant import parse_natural_text


router = APIRouter(
    prefix="/api/nlp",
    tags=["NLP Assistant"]
)


@router.post("/parse", response_model=NLPParseResponse)
def parse_symptoms(request: NLPParseRequest):

    if not request.text.strip():
        raise HTTPException(
            status_code=400,
            detail="Text prompt cannot be empty."
        )

    try:
        result = parse_natural_text(request.text)

        return NLPParseResponse(**result)

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail="NLP processing failed."
        )
