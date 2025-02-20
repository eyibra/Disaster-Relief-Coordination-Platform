import { describe, it, expect, beforeEach } from "vitest"

describe("Donation Tracking Contract", () => {
  let mockDonations: Map<number, any>
  let mockExpenditures: Map<number, any>
  let donationNonce: number
  let expenditureNonce: number
  let mockTokenBalances: Map<string, number>
  
  beforeEach(() => {
    mockDonations = new Map()
    mockExpenditures = new Map()
    donationNonce = 0
    expenditureNonce = 0
    mockTokenBalances = new Map()
  })
  
  const mockContractCall = (method: string, args: any[], sender: string) => {
    switch (method) {
      case "donate":
        const [amount, purpose] = args
        if (amount <= 0) {
          return { success: false, error: "Invalid amount" }
        }
        const senderBalance = mockTokenBalances.get(sender) || 0
        if (senderBalance < amount) {
          return { success: false, error: "Insufficient balance" }
        }
        mockTokenBalances.set(sender, senderBalance - amount)
        donationNonce++
        mockDonations.set(donationNonce, {
          donor: sender,
          amount,
          purpose,
          status: "received",
        })
        return { success: true, value: donationNonce }
      case "record-expenditure":
        const [expAmount, expPurpose, needId] = args
        if (sender !== "CONTRACT_OWNER") {
          return { success: false, error: "Not authorized" }
        }
        if (expAmount <= 0) {
          return { success: false, error: "Invalid amount" }
        }
        expenditureNonce++
        mockExpenditures.set(expenditureNonce, {
          amount: expAmount,
          purpose: expPurpose,
          needId,
          status: "recorded",
        })
        return { success: true, value: expenditureNonce }
      case "update-donation-status":
        const [donationId, newDonationStatus] = args
        if (sender !== "CONTRACT_OWNER") {
          return { success: false, error: "Not authorized" }
        }
        const donation = mockDonations.get(donationId)
        if (!donation) {
          return { success: false, error: "Donation not found" }
        }
        donation.status = newDonationStatus
        mockDonations.set(donationId, donation)
        return { success: true }
      case "update-expenditure-status":
        const [expenditureId, newExpStatus] = args
        if (sender !== "CONTRACT_OWNER") {
          return { success: false, error: "Not authorized" }
        }
        const expenditure = mockExpenditures.get(expenditureId)
        if (!expenditure) {
          return { success: false, error: "Expenditure not found" }
        }
        expenditure.status = newExpStatus
        mockExpenditures.set(expenditureId, expenditure)
        return { success: true }
      case "get-donation":
        return { success: true, value: mockDonations.get(args[0]) }
      case "get-expenditure":
        return { success: true, value: mockExpenditures.get(args[0]) }
      case "get-total-donations":
        return { success: true, value: donationNonce }
      case "get-total-expenditures":
        return { success: true, value: expenditureNonce }
      default:
        return { success: false, error: "Method not found" }
    }
  }
  
  it("should make a donation", () => {
    mockTokenBalances.set("user1", 1000)
    const result = mockContractCall("donate", [100, "General fund"], "user1")
    expect(result.success).toBe(true)
    expect(result.value).toBe(1)
  })
  
  it("should not allow donation with insufficient balance", () => {
    mockTokenBalances.set("user2", 50)
    const result = mockContractCall("donate", [100, "Emergency relief"], "user2")
    expect(result.success).toBe(false)
  })
  
  it("should record an expenditure", () => {
    const result = mockContractCall("record-expenditure", [500, "Medical supplies", 1], "CONTRACT_OWNER")
    expect(result.success).toBe(true)
    expect(result.value).toBe(1)
  })
  
  it("should not allow unauthorized expenditure recording", () => {
    const result = mockContractCall("record-expenditure", [300, "Food distribution", 2], "user3")
    expect(result.success).toBe(false)
  })
  
  it("should update donation status", () => {
    mockTokenBalances.set("user4", 1000)
    mockContractCall("donate", [200, "Shelter construction"], "user4")
    const result = mockContractCall("update-donation-status", [1, "allocated"], "CONTRACT_OWNER")
    expect(result.success).toBe(true)
  })
  
  it("should update expenditure status", () => {
    mockContractCall("record-expenditure", [400, "Water purification", 3], "CONTRACT_OWNER")
    const result = mockContractCall("update-expenditure-status", [1, "completed"], "CONTRACT_OWNER")
    expect(result.success).toBe(true)
  })
  
  it("should get donation information", () => {
    mockTokenBalances.set("user5", 2000)
    mockContractCall("donate", [500, "Education fund"], "user5")
    const result = mockContractCall("get-donation", [1], "anyone")
    expect(result.success).toBe(true)
    expect(result.value.amount).toBe(500)
  })
  
  it("should get expenditure information", () => {
    mockContractCall("record-expenditure", [600, "Temporary housing", 4], "CONTRACT_OWNER")
    const result = mockContractCall("get-expenditure", [1], "anyone")
    expect(result.success).toBe(true)
    expect(result.value.purpose).toBe("Temporary housing")
  })
  
  it("should get total donations", () => {
    mockTokenBalances.set("user6", 3000)
    mockContractCall("donate", [1000, "General fund"], "user6")
    mockContractCall("donate", [500, "Emergency relief"], "user6")
    const result = mockContractCall("get-total-donations", [], "anyone")
    expect(result.success).toBe(true)
    expect(result.value).toBe(2)
  })
  
  it("should get total expenditures", () => {
    mockContractCall("record-expenditure", [700, "Medical supplies", 5], "CONTRACT_OWNER")
    mockContractCall("record-expenditure", [300, "Food distribution", 6], "CONTRACT_OWNER")
    const result = mockContractCall("get-total-expenditures", [], "anyone")
    expect(result.success).toBe(true)
    expect(result.value).toBe(2)
  })
})

