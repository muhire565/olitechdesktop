; Custom NSIS branding for OLITECHHUB installer
!macro customHeader
  !system "echo Building OLITECHHUB installer..."
!macroend

!macro customWelcomePage
  ; Default welcome page is used; license page follows from electron-builder license setting.
!macroend

!macro customInstall
  DetailPrint "Installing OLITECHHUB by Olitech Hub..."
!macroend

!macro customUnInstall
  DetailPrint "Removing OLITECHHUB..."
!macroend
