Output demo.gif

Set FontSize 18
Set Width 1000
Set Height 450
Set Padding 25
Set Theme "Catppuccin Mocha"
Set TypingSpeed 30ms
Set LetterSpacing 0

# Cleanup before starting (Hidden)
Hide
Type "rm -rf my-new-app"
Enter
Type "clear"
Enter
Sleep 500ms
Show

# Run the CLI
Type "npx zero-setup-biome my-new-app"
Sleep 200ms
Enter

# Wait for scaffolding to complete
Sleep 10s

# Show the created project
Type "cd my-new-app && ls"
Enter
Sleep 3s

# Cleanup (Hidden)
Hide
Type "cd .."
Enter
Type "rm -rf my-new-app"
Enter
