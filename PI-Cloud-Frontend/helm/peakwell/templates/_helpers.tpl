{{/*
Expand the namespace — use release namespace throughout.
*/}}
{{- define "peakwell.namespace" -}}
{{- .Release.Namespace }}
{{- end }}

{{/*
Common labels applied to every resource.
*/}}
{{- define "peakwell.labels" -}}
app.kubernetes.io/managed-by: {{ .Release.Service }}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
