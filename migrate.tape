Output migrate.gif

Set FontSize 18
Set Width 1000
Set Height 550
Set Padding 25
Set Theme "Catppuccin Mocha"
Set TypingSpeed 30ms

# Setup a fake legacy project (Hidden)
Hide
Type "rm -rf legacy-demo"
Enter
Type "mkdir -p legacy-demo && cd legacy-demo"
Enter
# Create valid package.json
Type "npm init -y > /dev/null 2>&1"
Enter
Type "npm pkg set devDependencies.eslint=^8.0.0 devDependencies.prettier=^3.0.0 > /dev/null 2>&1"
Enter
# Create valid .prettierrc JSON
Type 'echo '"'"'{"semi": true, "singleQuote": true}'"'"' > .prettierrc'
Enter
# Create .eslintrc.js
Type 'echo "module.exports = { rules: {} };" > .eslintrc.js'
Enter
# Initialize git with a commit so no uncommitted changes prompt
Type "git init -q && git add -A && git commit -m 'init' -q"
Enter
Type "clear"
Enter
Sleep 500ms
Show

# Run migration
Type "npx zero-setup-biome migrate"
Sleep 200ms
Enter

# Wait for analysis and first prompt
Sleep 2s

# Confirm "Ready to migrate?" - Yes
Type "y"
Enter

# Wait and handle "Use relaxed lint rules?" prompt
Sleep 3s
Enter

# Wait and handle "Remove ESLint/Prettier packages?" prompt
Sleep 3s
Enter

# Wait and handle "Update package.json scripts?" prompt
Sleep 3s
Enter

# Wait and handle "Apply Biome formatting now?" prompt
Sleep 3s
Enter

# Wait for all operations to complete
Sleep 6s

# Show the created biome.json
Type "cat biome.json"
Enter
Sleep 4s

# Cleanup (Hidden)
Hide
Type "cd .."
Enter
Type "rm -rf legacy-demo"
Enter
