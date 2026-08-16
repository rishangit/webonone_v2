# Auth and tenant model

AI is available to **all** authenticated Identity users and to **website guests**.

| Principal | Token | company_id | Isolation |
|-----------|-------|------------|-----------|
| Super admin | Identity JWT | null | `user_id` |
| Company admin | Identity JWT | required on their Identity session | `user_id` + that company |
| Member / staff | Identity JWT | optional | `user_id` + NULL-safe company |
| Default user | Identity JWT | null | `user_id` |
| Website guest | AI guest JWT | null | `guest_id` |

`POST /api/v1/guest-sessions` is rate-limited and returns a short-lived JWT (`iss=webonone-ai`, `token_use=guest`). It is not a second login system.

Client `companyId` / `userId` / `guestId` fields are ignored. Cross-principal conversation ids return **404**.
