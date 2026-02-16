import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { ContractBriefing } from "./contract-briefing"
import { Contract } from "@/domain/entities/contract"
import { ApiContractRepository } from "@/infrastructure/repositories/contract-repository"

// Mock the repository
jest.mock("@/infrastructure/repositories/contract-repository")

const mockContract: Contract = {
    id: 1,
    campaign_id: 1,
    brand_id: 1,
    creator_id: 2,
    title: "Test Contract",
    status: "active",
    amount: 1000,
    budget: 1000,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
    briefing: {
        objectives: "Test objectives",
        target_audience: "Test audience",
        key_messages: "Test messages",
        channels: "Test channels",
        deadlines: "Test deadlines",
        brand_requirements: "Test requirements"
    }
}

describe("ContractBriefing", () => {
    const mockUpdate = jest.fn()
    const mockRepositoryUpdate = jest.fn()

    beforeEach(() => {
        (ApiContractRepository as jest.Mock).mockImplementation(() => ({
            update: mockRepositoryUpdate
        }))
        jest.clearAllMocks()
    })

    it("renders briefing details in read-only mode", () => {
        render(<ContractBriefing contract={mockContract} onUpdate={mockUpdate} isEditable={false} />)
        
        expect(screen.getByText("Test objectives")).toBeInTheDocument()
        expect(screen.getByText("Test audience")).toBeInTheDocument()
        expect(screen.queryByRole("button", { name: /salvar alterações/i })).not.toBeInTheDocument()
    })

    it("renders input fields in editable mode", () => {
        render(<ContractBriefing contract={mockContract} onUpdate={mockUpdate} isEditable={true} />)
        
        expect(screen.getByLabelText(/objetivos da campanha/i)).toHaveValue("Test objectives")
        expect(screen.getByRole("button", { name: /salvar alterações/i })).toBeInTheDocument()
    })

    it("updates contract when save button is clicked", async () => {
        mockRepositoryUpdate.mockResolvedValue({
            ...mockContract,
            briefing: { ...mockContract.briefing, objectives: "Updated objectives" }
        })

        render(<ContractBriefing contract={mockContract} onUpdate={mockUpdate} isEditable={true} />)
        
        const input = screen.getByLabelText(/objetivos da campanha/i)
        fireEvent.change(input, { target: { value: "Updated objectives" } })
        
        const saveButton = screen.getByRole("button", { name: /salvar alterações/i })
        fireEvent.click(saveButton)

        await waitFor(() => {
            expect(mockRepositoryUpdate).toHaveBeenCalledWith(1, expect.objectContaining({
                briefing: expect.objectContaining({
                    objectives: "Updated objectives"
                })
            }))
            expect(mockUpdate).toHaveBeenCalled()
        })
    })
})
