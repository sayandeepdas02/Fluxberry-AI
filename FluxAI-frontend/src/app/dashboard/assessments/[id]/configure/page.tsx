import { ConfigureAssessment } from "@/features/assessments/components/configure-assessment"

export default function ConfigureAssessmentPage({ params }: { params: { id: string } }) {
    return <ConfigureAssessment assessmentId={params.id} />
}
