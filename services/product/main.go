package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
)

func main() {
	serviceName := os.Getenv("SERVICE_NAME")
	if serviceName == "" { serviceName = "generic-service" }

	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		corrID := r.Header.Get("x-correlation-id")
		log.Printf("[%s] Request received on %s", corrID, serviceName)
		fmt.Fprintf(w, `{"service": "%s", "trace_id": "%s", "status": "active"}`, serviceName, corrID)
	})

	log.Printf("🚀 %s starting on :8080", serviceName)
	http.ListenAndServe(":8080", nil)
}