#!/bin/bash

set -e

echo "🔍 Checking code formatting with Prettier..."

# 포맷팅 체크 실행
if pnpm format:check > /tmp/format-check.log 2>&1; then
    echo "✅ All files are properly formatted!"
    exit 0
else
    echo "❌ Formatting issues found!"
    echo ""
    
    # 문제가 있는 파일들 표시
    echo "📋 Files that need formatting:"
    cat /tmp/format-check.log | grep -E '\[warn\]' | sed 's/\[warn\] /  • /' || echo "  (No specific files listed)"
    
    echo ""
    echo "💡 To fix these issues:"
    echo "  Local:  pnpm format"
    echo "  Single: pnpm prettier --write [filename]"
    echo ""
    echo "📝 This will format all files according to the project's Prettier configuration."
    
    # 클린업
    rm -f /tmp/format-check.log
    exit 1
fi 