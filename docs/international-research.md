# Investigación internacional de candidatas

Versión inicial: 2026-09-27. Se ejecuta al pulsar «Investigar webs y contactos» en Discover. No es un envío periódico ni dispara Apollo.

## Flujo

1. Normalizar código regional (UK → GB); resolver nombre inglés con Intl para búsquedas fuera de los mercados originales.
2. Leer caché antes de consultar Tavily; un error de lectura impide gastar una nueva consulta.
3. Una búsqueda Tavily basic, con país en el texto. El parámetro country solo se usa en los mercados previamente configurados; no es un filtro estricto.
4. Conservar candidatas sin atribuirles el país solicitado. Deduplicar por dominio/nombre Unicode, conservando palabras significativas como Films/Productions.
5. Revisar hasta 12 webs, en grupos de seis, con un máximo de tres páginas y siete segundos por web. Solo HTTP(S) público, IP fijada tras resolución DNS, redirecciones revalidadas, límite de un MB y sin ejecución JavaScript.
6. Guardar páginas, emails publicados, personas, fecha y estado en el JSON de external_research_cache (migración 20260902000017 ya existente). Caché v3, caducidad de 30 días.
7. Mostrar y exportar investigación aunque falle el guardado final, para permitir su recuperación manual.

## Límites explícitos

- Alcance internacional no implica exhaustividad ni exactitud garantizada por país. El país y la titularidad de una web siguen pendientes hasta la verificación de admisión existente.
- No se infieren relaciones email-persona. Los emails no se validan mediante envío/SMTP.
- Extracción de Person estructurado admite cargos en cualquier idioma. El fallback de texto tiene vocabulario ES/EN/PT/FR/DE/IT; otras lenguas y HTML irregular pueden requerir revisión manual.
- No lee PDF, páginas JavaScript, LinkedIn autenticado ni evasión de bloqueos. IPv6-only se marca como fallo de lectura.
- Los resultados que superen el límite de 12 webs permanecen como pendientes; no se presentan como analizados.
- No hace scraping masivo ni campañas. Los datos de investigación quedan en la caché; el botón de admisión no crea personas automáticamente.
- Una consulta nueva cuesta el consumo de Tavily basic; las lecturas directas no llaman a APIs de enriquecimiento. Consultas simultáneas desde distintas instancias pueden duplicar consumo: todavía no hay bloqueo distribuido ni presupuesto global.
- La lectura previa de caché no garantiza que el guardado posterior funcione si la base falla después. En ese caso exportar CSV antes de cerrar.

## Verificación antes de producción

Ejecutar typecheck, lint y scripts/test-international-research.ts y scripts/test-research-integrity.ts. Confirmar TAVILY_API_KEY y la migración de caché en el entorno destino. Hacer prueba autenticada ES, GB y JP; repetir exactamente la consulta y comprobar cacheHit. Contrastar manualmente fuentes antes de admitir candidatas. No afirmar validación multinacional real solo por pasar pruebas locales.
