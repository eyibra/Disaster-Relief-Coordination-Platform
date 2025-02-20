;; Need Assessment Contract

;; Constants
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_NOT_AUTHORIZED (err u401))
(define-constant ERR_NOT_FOUND (err u404))
(define-constant ERR_INVALID_PRIORITY (err u400))

;; Data Maps
(define-map needs
  { need-id: uint }
  {
    description: (string-ascii 256),
    location: (string-ascii 100),
    priority: uint,
    status: (string-ascii 20),
    created-by: principal,
    created-at: uint
  }
)

(define-data-var need-nonce uint u0)

;; Public Functions
(define-public (report-need (description (string-ascii 256)) (location (string-ascii 100)) (priority uint))
  (let
    ((new-need-id (+ (var-get need-nonce) u1)))
    (asserts! (and (>= priority u1) (<= priority u5)) ERR_INVALID_PRIORITY)
    (map-set needs
      { need-id: new-need-id }
      {
        description: description,
        location: location,
        priority: priority,
        status: "reported",
        created-by: tx-sender,
        created-at: block-height
      }
    )
    (var-set need-nonce new-need-id)
    (ok new-need-id)
  )
)

(define-public (update-need-status (need-id uint) (new-status (string-ascii 20)))
  (let
    ((need (unwrap! (map-get? needs { need-id: need-id }) ERR_NOT_FOUND)))
    (asserts! (or (is-eq tx-sender CONTRACT_OWNER) (is-eq tx-sender (get created-by need))) ERR_NOT_AUTHORIZED)
    (ok (map-set needs
      { need-id: need-id }
      (merge need { status: new-status })
    ))
  )
)

(define-public (update-need-priority (need-id uint) (new-priority uint))
  (let
    ((need (unwrap! (map-get? needs { need-id: need-id }) ERR_NOT_FOUND)))
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_NOT_AUTHORIZED)
    (asserts! (and (>= new-priority u1) (<= new-priority u5)) ERR_INVALID_PRIORITY)
    (ok (map-set needs
      { need-id: need-id }
      (merge need { priority: new-priority })
    ))
  )
)

;; Read-only Functions
(define-read-only (get-need (need-id uint))
  (map-get? needs { need-id: need-id })
)

(define-read-only (get-total-needs)
  (ok (var-get need-nonce))
)

