;; Donation Tracking Contract

;; Constants
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_NOT_AUTHORIZED (err u401))
(define-constant ERR_NOT_FOUND (err u404))
(define-constant ERR_INVALID_AMOUNT (err u400))

;; Fungible Token Definition
(define-fungible-token donation-token u1000000000)

;; Data Maps
(define-map donations
  { donation-id: uint }
  {
    donor: principal,
    amount: uint,
    purpose: (string-ascii 256),
    status: (string-ascii 20)
  }
)

(define-map expenditures
  { expenditure-id: uint }
  {
    amount: uint,
    purpose: (string-ascii 256),
    need-id: uint,
    status: (string-ascii 20)
  }
)

(define-data-var donation-nonce uint u0)
(define-data-var expenditure-nonce uint u0)

;; Public Functions
(define-public (donate (amount uint) (purpose (string-ascii 256)))
  (let
    ((new-donation-id (+ (var-get donation-nonce) u1)))
    (asserts! (> amount u0) ERR_INVALID_AMOUNT)
    (try! (ft-transfer? donation-token amount tx-sender (as-contract tx-sender)))
    (map-set donations
      { donation-id: new-donation-id }
      {
        donor: tx-sender,
        amount: amount,
        purpose: purpose,
        status: "received"
      }
    )
    (var-set donation-nonce new-donation-id)
    (ok new-donation-id)
  )
)

(define-public (record-expenditure (amount uint) (purpose (string-ascii 256)) (need-id uint))
  (let
    ((new-expenditure-id (+ (var-get expenditure-nonce) u1)))
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_NOT_AUTHORIZED)
    (asserts! (> amount u0) ERR_INVALID_AMOUNT)
    (map-set expenditures
      { expenditure-id: new-expenditure-id }
      {
        amount: amount,
        purpose: purpose,
        need-id: need-id,
        status: "recorded"
      }
    )
    (var-set expenditure-nonce new-expenditure-id)
    (ok new-expenditure-id)
  )
)

(define-public (update-donation-status (donation-id uint) (new-status (string-ascii 20)))
  (let
    ((donation (unwrap! (map-get? donations { donation-id: donation-id }) ERR_NOT_FOUND)))
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_NOT_AUTHORIZED)
    (ok (map-set donations
      { donation-id: donation-id }
      (merge donation { status: new-status })
    ))
  )
)

(define-public (update-expenditure-status (expenditure-id uint) (new-status (string-ascii 20)))
  (let
    ((expenditure (unwrap! (map-get? expenditures { expenditure-id: expenditure-id }) ERR_NOT_FOUND)))
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_NOT_AUTHORIZED)
    (ok (map-set expenditures
      { expenditure-id: expenditure-id }
      (merge expenditure { status: new-status })
    ))
  )
)

;; Read-only Functions
(define-read-only (get-donation (donation-id uint))
  (map-get? donations { donation-id: donation-id })
)

(define-read-only (get-expenditure (expenditure-id uint))
  (map-get? expenditures { expenditure-id: expenditure-id })
)

(define-read-only (get-total-donations)
  (ok (var-get donation-nonce))
)

(define-read-only (get-total-expenditures)
  (ok (var-get expenditure-nonce))
)

