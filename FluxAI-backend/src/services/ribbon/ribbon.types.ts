/**
 * Ribbon API types (Ribbon.ai – interactive voice AI interviews)
 * @see https://docs.ribbon.ai/
 */

export interface RibbonCreateFlowRequest {
    org_name: string
    title: string
    questions: string[]
    voice_id?: string | null
    language?: string | null
    redirect_url?: string | null
    webhook_url?: string | null
    webhook_secret_key?: string | null
    additional_instructions?: string | null
    additional_info?: string | null
    intro?: string | null
    outro?: string | null
    interview_type?: 'general' | 'recruitment' | null
}

export interface RibbonCreateFlowResponse {
    interview_flow_id: string
}

export interface RibbonCreateInterviewRequest {
    interview_flow_id: string
    interviewee_email_address?: string | null
    interviewee_first_name?: string | null
    interviewee_last_name?: string | null
}

export interface RibbonCreateInterviewResponse {
    interview_id: string
    interview_link: string
}

export interface RibbonWord {
    start: number
    end: number
    word: string
}

export interface RibbonSegment {
    content: string
    role: string
    words: RibbonWord[]
}

export interface RibbonBaseSegment {
    content: string
    role: string
}

export interface RibbonQuestionToTranscriptMapping {
    script_question: string
    transcript_item_indices: number[]
    start_timestamp: number
    end_timestamp: number
    transcript_items: RibbonBaseSegment[]
}

export interface RibbonScores {
    communication?: number | null
    motivation?: number | null
    skills?: number | null
    language_vocabulary_and_expression?: number | null
    language_grammar_and_structure?: number | null
    language_fluency_and_pace?: number | null
    language_comprehension?: number | null
}

export interface RibbonInterviewData {
    transcript: string
    transcript_with_timestamp: RibbonSegment[]
    questions_to_transcript_mapping: RibbonQuestionToTranscriptMapping[]
    audio_url?: string | null
    video_url?: string | null
    summary?: string | null
    scores?: RibbonScores | null
}

export interface RibbonGetInterviewResponse {
    interview_flow_id: string
    interview_id: string
    team_id: string
    status: 'incomplete' | 'completed'
    interview_data: RibbonInterviewData | null
}

export interface RibbonWebhookPayload {
    event_type: 'interview_processed' | 'video_processed' | 'candidate_status_updated'
    interview_flow_id: string
    interview_id: string
    interview_link?: string
    status?: string
}
