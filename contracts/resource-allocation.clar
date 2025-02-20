;; Resource Allocation Contract

;; Constants
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_NOT_AUTHORIZED (err u401))
(define-constant ERR_NOT_FOUND (err u404))
(define-constant ERR_INSUFFICIENT_RESOURCES (err u400))

;; Data Maps
(define-map resources
  { resource-id: uint }
  {
    name: (string-ascii 100),
    quantity: uint,
    location: (string-ascii 100)
  }
)

(define-map allocations
  { allocation-id: uint }
  {
    resource-id: uint,
    need-id: uint,
    quantity: uint,
    status: (string-ascii 20)
  }
)

(define-data-var resource-nonce uint u0)
(define-data-var allocation-nonce uint u0)

;; Public Functions
(define-public (add-resource (name (string-ascii 100)) (quantity uint) (location (string-ascii 100)))
  (let
    ((new-resource-id (+ (var-get resource-nonce) u1)))
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_NOT_AUTHORIZED)
    (map-set resources
      { resource-id: new-resource-id }
      {
        name: name,
        quantity: quantity,
        location: location
      }
    )
    (var-set resource-nonce new-resource-id)
    (ok new-resource-id)
  )
)

(define-public (allocate-resource (resource-id uint) (need-id uint) (quantity uint))
  (let
    ((resource (unwrap! (map-get? resources { resource-id: resource-id }) ERR_NOT_FOUND))
     (new-allocation-id (+ (var-get allocation-nonce) u1)))
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_NOT_AUTHORIZED)
    (asserts! (>= (get quantity resource) quantity) ERR_INSUFFICIENT_RESOURCES)
    (map-set resources
      { resource-id: resource-id }
      (merge resource { quantity: (- (get quantity resource) quantity) })
    )
    (map-set allocations
      { allocation-id: new-allocation-id }
      {
        resource-id: resource-id,
        need-id: need-id,
        quantity: quantity,
        status: "allocated"
      }
    )
    (var-set allocation-nonce new-allocation-id)
    (ok new-allocation-id)
  )
)

(define-public (update-allocation-status (allocation-id uint) (new-status (string-ascii 20)))
  (let
    ((allocation (unwrap! (map-get? allocations { allocation-id: allocation-id }) ERR_NOT_FOUND)))
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_NOT_AUTHORIZED)
    (ok (map-set allocations
      { allocation-id: allocation-id }
      (merge allocation { status: new-status })
    ))
  )
)

;; Read-only Functions
(define-read-only (get-resource (resource-id uint))
  (map-get? resources { resource-id: resource-id })
)

(define-read-only (get-allocation (allocation-id uint))
  (map-get? allocations { allocation-id: allocation-id })
)

