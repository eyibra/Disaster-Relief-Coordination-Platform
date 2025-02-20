import { describe, it, expect, beforeEach } from "vitest"

describe("Resource Allocation Contract", () => {
  let mockResources: Map<number, any>
  let mockAllocations: Map<number, any>
  let resourceNonce: number
  let allocationNonce: number
  
  beforeEach(() => {
    mockResources = new Map()
    mockAllocations = new Map()
    resourceNonce = 0
    allocationNonce = 0
  })
  
  const mockContractCall = (method: string, args: any[], sender: string) => {
    switch (method) {
      case "add-resource":
        const [name, quantity, location] = args
        if (sender !== "CONTRACT_OWNER") {
          return { success: false, error: "Not authorized" }
        }
        resourceNonce++
        mockResources.set(resourceNonce, { name, quantity, location })
        return { success: true, value: resourceNonce }
      case "allocate-resource":
        const [resourceId, needId, allocateQuantity] = args
        if (sender !== "CONTRACT_OWNER") {
          return { success: false, error: "Not authorized" }
        }
        const resource = mockResources.get(resourceId)
        if (!resource) {
          return { success: false, error: "Resource not found" }
        }
        if (resource.quantity < allocateQuantity) {
          return { success: false, error: "Insufficient resources" }
        }
        resource.quantity -= allocateQuantity
        mockResources.set(resourceId, resource)
        allocationNonce++
        mockAllocations.set(allocationNonce, {
          resourceId,
          needId,
          quantity: allocateQuantity,
          status: "allocated",
        })
        return { success: true, value: allocationNonce }
      case "update-allocation-status":
        const [allocationId, newStatus] = args
        if (sender !== "CONTRACT_OWNER") {
          return { success: false, error: "Not authorized" }
        }
        const allocation = mockAllocations.get(allocationId)
        if (!allocation) {
          return { success: false, error: "Allocation not found" }
        }
        allocation.status = newStatus
        mockAllocations.set(allocationId, allocation)
        return { success: true }
      case "get-resource":
        return { success: true, value: mockResources.get(args[0]) }
      case "get-allocation":
        return { success: true, value: mockAllocations.get(args[0]) }
      default:
        return { success: false, error: "Method not found" }
    }
  }
  
  it("should add a resource", () => {
    const result = mockContractCall("add-resource", ["Water bottles", 1000, "Warehouse A"], "CONTRACT_OWNER")
    expect(result.success).toBe(true)
    expect(result.value).toBe(1)
  })
  
  it("should not allow unauthorized resource addition", () => {
    const result = mockContractCall("add-resource", ["Food packets", 500, "Warehouse B"], "user1")
    expect(result.success).toBe(false)
  })
  
  it("should allocate a resource", () => {
    mockContractCall("add-resource", ["Blankets", 200, "Warehouse C"], "CONTRACT_OWNER")
    const result = mockContractCall("allocate-resource", [1, 1, 50], "CONTRACT_OWNER")
    expect(result.success).toBe(true)
    expect(result.value).toBe(1)
  })
  
  it("should not allocate more than available", () => {
    mockContractCall("add-resource", ["Tents", 100, "Warehouse D"], "CONTRACT_OWNER")
    const result = mockContractCall("allocate-resource", [1, 1, 150], "CONTRACT_OWNER")
    expect(result.success).toBe(false)
  })
  
  it("should update allocation status", () => {
    mockContractCall("add-resource", ["Medical kits", 300, "Warehouse E"], "CONTRACT_OWNER")
    mockContractCall("allocate-resource", [1, 1, 50], "CONTRACT_OWNER")
    const result = mockContractCall("update-allocation-status", [1, "delivered"], "CONTRACT_OWNER")
    expect(result.success).toBe(true)
  })
  
  it("should get resource information", () => {
    mockContractCall("add-resource", ["Generators", 20, "Warehouse F"], "CONTRACT_OWNER")
    const result = mockContractCall("get-resource", [1], "anyone")
    expect(result.success).toBe(true)
    expect(result.value.name).toBe("Generators")
  })
  
  it("should get allocation information", () => {
    mockContractCall("add-resource", ["Fuel cans", 500, "Warehouse G"], "CONTRACT_OWNER")
    mockContractCall("allocate-resource", [1, 1, 100], "CONTRACT_OWNER")
    const result = mockContractCall("get-allocation", [1], "anyone")
    expect(result.success).toBe(true)
    expect(result.value.quantity).toBe(100)
  })
})

