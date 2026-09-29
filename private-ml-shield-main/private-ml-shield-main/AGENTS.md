<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- ML training, encryption and inference run client-side (Web Crypto + pure TS in src/lib/); the SQL database (Lovable Cloud) stores only AES-GCM ciphertext and aggregate training metrics per user, because sensitive plaintext must never leave the device.
