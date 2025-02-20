import { describe, it, expect, beforeEach } from "vitest"

describe("Need Assessment Contract", () => {
  let mockStorage: Map<number, any>
  let needNonce: number
  
  beforeEach(() => {
    mockStorage = new Map()
    needNonce = 0
  })
  
  const mockContractCall = (method: string, args: any[], sender: string) => {
    switch (method) {
      case "report-need":
        const [description, location, priority] = args
        if (priority < 1 || priority > 5) {
          return { success: false, error: "Invalid priority" }
        }
        needNonce++
        mockStorage.set(needNonce, {
          description,
          location,
          priority,
          status: "reported",
          createdBy: sender,
          createdAt: 100, // Mock block height
        })
        return { success: true, value: needNonce }
      case "update-need-status":
        const [needId, newStatus] = args
        const need = mockStorage.get(needId)
        if (!need) {
          return { success: false, error: "Not found" }
        }
        if (sender !== "CONTRACT_OWNER" && sender !== need.createdBy) {
          return { success: false, error: "Not authorized" }
        }
        need.status = newStatus
        mockStorage.set(needId, need)
        return { success: true }
      case "update-need-priority":
        const [priorityNeedId, newPriority] = args
        if (sender !== "CONTRACT_OWNER") {
          return { success: false, error: "Not authorized" }
        }
        if (newPriority < 1 || newPriority > 5) {
          return { success: false, error: "Invalid priority" }
        }
        const priorityNeed = mockStorage.get(priorityNeedId)
        if (!priorityNeed) {
          return { success: false, error: "Not found" }
        }
        priorityNeed.priority = newPriority
        mockStorage.set(priorityNeedId, priorityNeed)
        return { success: true }
      case "get-need":
        return { success: true, value: mockStorage.get(args[0]) }
      case "get-total-needs":
        return { success: true, value: needNonce }
      default:
        return { success: false, error: "Method not found" }
    }
  }
  
  it("should report a need", () => {
    const result = mockContractCall("report-need", ["Food shortage", "City A", 3], "user1")
    expect(result.success).toBe(true)
    expect(result.value).toBe(1)
  })
  
  it("should not report a need with invalid priority", () => {
    const result = mockContractCall("report-need", ["Water shortage", "City B", 6], "user1")
    expect(result.success).toBe(false)
  })
  
  it("should update need status", () => {
    mockContractCall("report-need", ["Medical supplies needed", "City C", 4], "user1")
    const result = mockContractCall("update-need-status", [1, "in-progress"], "CONTRACT_OWNER")
    expect(result.success).toBe(true)
  })
  
  it("should not allow unauthorized status update", () => {
    mockContractCall("report-need", ["Shelter required", "City D", 2], "user1")
    const result = mockContractCall("update-need-status", [1, "completed"], "user2")
    expect(result.success).toBe(false)
  })
  
  it("should update need priority", () => {
    mockContractCall("report-need", ["Emergency evacuation", "City E", 3], "user1")
    const result = mockContractCall("update-need-priority", [1, 5], "CONTRACT_OWNER")
    expect(result.success).toBe(true)
  })
  
  it("should not allow unauthorized priority update", () => {
    mockContractCall("report-need", ["Power outage", "City F", 2], "user1")
    const result = mockContractCall("update-need-priority", [1, 4], "user2")
    expect(result.success).toBe(false)
  })
  
  it("should get need information", () => {
    mockContractCall("report-need", ["Road blockage", "City G", 1], "user1")
    const result = mockContractCall("get-need", [1], "anyone")
    expect(result.success).toBe(true)
    expect(result.value.description).toBe("Road blockage")
  })
  
  it("should get total needs", () => {
    mockContractCall("report-need", ["Need 1", "City H", 3], "user1")
    mockContractCall("report-need", ["Need 2", "City I", 2], "user2")
    const result = mockContractCall("get-total-needs", [], "anyone")
    expect(result.success).toBe(true)
    expect(result.value).toBe(2)
  })
})

