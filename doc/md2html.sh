#!/bin/bash
cd -- "$( dirname -- "${BASH_SOURCE[0]}" )"
for md_file in md/*.md; do
	html_file="html/$( basename -s ".md" "${md_file}" ).html"
	#cmark -t html --validate-utf8 --smart --unsafe "${md_file}" > "${html_file}"
	pandoc -f markdown -t html5 -s -o "${html_file}" "${md_file}"
done
