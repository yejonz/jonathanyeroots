"use client"

import { useState, useEffect, type ChangeEvent, type KeyboardEvent } from "react"
import type { DateRange } from "react-day-picker"
import { parse, isValid, isBefore } from "date-fns"
import ListingMap from "@/components/ui/listing-map"
import type { CSSProperties } from "react"

interface Listing {
  id: string
  address: string
  city: string | null
  state: string | null
  price: number
  bedrooms: number | null
  bathrooms: number | null
  squareFeet: number | null
  propertyType: string
  photoUrls: string[]
  status: string
  createdAt: string
  latitude: number
  longitude: number
}

// Consolidated styles for Dashboard's elements
interface Styles {
  container: CSSProperties
  header: CSSProperties
  title: CSSProperties
  subtitle: CSSProperties
  mainContent: CSSProperties
  mapSection: CSSProperties
  controlsSection: CSSProperties
  formGroup: CSSProperties
  label: CSSProperties
  input: CSSProperties
  button: (disabled: boolean) => CSSProperties
  searchCard: CSSProperties
  searchCardTitle: CSSProperties
  searchCardItem: CSSProperties
  reuseButton: (loading: boolean) => CSSProperties
  statusText: CSSProperties
  errorText: CSSProperties
}

/**
 * This page is a dashboard featuring a date/price filter for listings and a Mapbox map to display them.
 */
export default function Page() {
  const [dateRangeText, setDateRangeText] = useState<string>("")
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [subtext, setSubtext] = useState<string | null>(null)
  const [priceRangeText, setPriceRangeText] = useState<string>("")
  const [priceRange, setPriceRange] = useState<{ min?: number; max?: number }>({})
  const [isDateRangeValid, setIsDateRangeValid] = useState(false)
  const [isPriceRangeValid, setIsPriceRangeValid] = useState(false)
  const [lastSubmission, setLastSubmission] = useState<{ dateRange: string; priceRange: string } | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [listings, setListings] = useState<Listing[]>([])

  const handleDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    setDateRangeText(e.target.value)
  }

  const handlePriceChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPriceRangeText(e.target.value)
  }

  // This useEffect parses text into DateRange
  useEffect(() => {
    if (dateRangeText.length === 21) {
      try {
        // Split the text into two date strings
        const [startDateStr, endDateStr] = dateRangeText.split(":")

        // Parse the dates using date-fns
        const startDate = parse(startDateStr, "MM-dd-yyyy", new Date())
        const endDate = parse(endDateStr, "MM-dd-yyyy", new Date())

        // Validate the parsed dates
        if (!isValid(startDate)) {
          setSubtext("Invalid start date")
          setIsDateRangeValid(false)
          return
        }

        if (!isValid(endDate)) {
          setSubtext("Invalid end date")
          setIsDateRangeValid(false)
          return
        }

        // Validate date range (end date must be after start date)
        if (isBefore(endDate, startDate)) {
          setSubtext("End date must be after start date")
          setIsDateRangeValid(false)
          return
        }

        // Create the DateRange object
        const newDateRange: DateRange = {
          from: startDate,
          to: endDate,
        }

        console.log("Valid DateRange created:", newDateRange)

        // Update the state with the new DateRange
        setDateRange(newDateRange)
        setIsDateRangeValid(true)
      } catch (error) {
        setSubtext("Error parsing date range")
        setIsDateRangeValid(false)
        console.error("Error parsing date range:", error)
      }
    } else {
      setIsDateRangeValid(false)
    }
  }, [dateRangeText])

  // Parse price range text
  useEffect(() => {
    if (priceRangeText) {
      try {
        const [minStr, maxStr] = priceRangeText.split(":")
        const min = minStr ? Number.parseFloat(minStr) : undefined
        const max = maxStr ? Number.parseFloat(maxStr) : undefined

        if ((minStr && isNaN(min!)) || (maxStr && isNaN(max!))) {
          setSubtext("Invalid price format")
          setIsPriceRangeValid(false)
          return
        }

        if (min !== undefined && max !== undefined && min > max) {
          setSubtext("Minimum price must be less than maximum price")
          setIsPriceRangeValid(false)
          return
        }

        setPriceRange({ min, max })
        setIsPriceRangeValid(true)
      } catch (error) {
        setSubtext("Error parsing price range")
        setIsPriceRangeValid(false)
        console.error("Error parsing price range:", error)
      }
    } else {
      setIsPriceRangeValid(false)
    }
  }, [priceRangeText])

  // This useEffect fetches the count when both dateRange and priceRange are valid
  useEffect(() => {
    const fetchListingsCount = async () => {
      if (!isDateRangeValid || !isPriceRangeValid || !dateRange || !dateRange.from || !dateRange.to) {
        return
      }

      setLoading(true)
      setError(null)

      try {
        // Format dates for API request
        const startDate = dateRange.from.toISOString()
        const endDate = dateRange.to.toISOString()

        // Build query parameters
        const params = new URLSearchParams({
          startDate,
          endDate,
        })

        if (priceRange.min !== undefined) {
          params.append("minPrice", priceRange.min.toString())
        }
        if (priceRange.max !== undefined) {
          params.append("maxPrice", priceRange.max.toString())
        }

        // Make the API request with query parameters
        const response = await fetch(`/api/listings/filter/count?${params.toString()}`)

        if (!response.ok) {
          throw new Error(`Failed to fetch listings: ${response.statusText}`)
        }

        const listingsCount = await response.json()
        setSubtext(listingsCount.count + " listings found.")
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchListingsCount()
    // dependent on if date/price ranges are valid but ALSO changes in
    // date/price ranges to update with listings/count API fetch
  }, [dateRange, priceRange, isDateRangeValid, isPriceRangeValid])

  // Handle Enter key press to submit - only when not loading and both fields are valid
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !loading && isDateRangeValid && isPriceRangeValid) {
      e.preventDefault()
      handleSubmit()
    }
  }

  // Submit function that clears the input and fetches map data
  const handleSubmit = async () => {
    if (loading || !isDateRangeValid || !isPriceRangeValid || !dateRange || !dateRange.from || !dateRange.to) return

    try {
      setLoading(true)
      setError(null)

      // Format dates for API request
      const startDate = dateRange.from.toISOString()
      const endDate = dateRange.to.toISOString()

      // Build query parameters
      const params = new URLSearchParams({
        startDate,
        endDate,
      })

      if (priceRange.min !== undefined) {
        params.append("minPrice", priceRange.min.toString())
      }
      if (priceRange.max !== undefined) {
        params.append("maxPrice", priceRange.max.toString())
      }

      const response = await fetch(`/api/listings/filter?${params.toString()}`)

      if (!response.ok) {
        throw new Error("Failed to fetch map data")
      }

      const cleanedListings = await response.json()
      setListings(cleanedListings)

      // Store the last submitted search parameters
      setLastSubmission({
        dateRange: dateRangeText,
        priceRange: priceRangeText,
      })

      // Reset the input fields only after successful submission
      setDateRangeText("")
      setPriceRangeText("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred fetching map data")
    } finally {
      setLoading(false)
    }
  }

  // Dashboard CSS styles (inspired by Roots' color scheme!)
  const styles: Styles = {
    container: {
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh",
      maxWidth: "100vw",
      overflow: "hidden",
      backgroundColor: "#f5fff0", // Light mint background
      color: "#333333",
      fontFamily: "Arial, sans-serif",
    },
    header: {
      padding: "16px 24px",
      backgroundColor: "#ffffff",
      borderBottom: "1px solid #e0e0e0",
      textAlign: "center",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    },
    title: {
      fontSize: "2rem",
      fontWeight: "bold",
      margin: "8px 0",
      color: "#222222",
    },
    subtitle: {
      fontSize: "1rem",
      margin: "8px 0",
      color: "#222222",
    },
    mainContent: {
      display: "flex",
      flexDirection: "row",
      flex: 1,
      height: "calc(100vh - 100px)",
    },
    mapSection: {
      flex: 1,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minWidth: 0,
      overflow: "hidden",
      padding: "16px 0 16px 16px",
    },
    controlsSection: {
      width: "400px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "24px",
      borderLeft: "1px solid #e0e0e0",
      marginLeft: "16px",
      backgroundColor: "#ffffff",
    },
    formGroup: {
      marginBottom: "32px",
      width: "100%",
    },
    label: {
      display: "block",
      marginBottom: "8px",
      fontWeight: "bold",
      fontSize: "1.1rem",
      color: "#222222",
    },
    input: {
      padding: "12px 16px",
      fontSize: "1rem",
      border: "1px solid #dddddd",
      borderRadius: "8px",
      width: "100%",
      boxSizing: "border-box",
      marginBottom: "24px",
      backgroundColor: "#f8fef5",
      color: "#222222",
    },
    button: (disabled: boolean) => ({
      padding: "14px 24px",
      fontSize: "1rem",
      fontWeight: "bold",
      backgroundColor: disabled ? "#adb5bd" : "#98E934",
      color: disabled ? "#ffffff" : "#222222",
      border: "none",
      borderRadius: "100px",
      cursor: disabled ? "not-allowed" : "pointer",
      width: "100%",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      transition: "all 0.2s ease",
    }),
    searchCard: {
      padding: "16px",
      backgroundColor: "#f5fff0",
      border: "1px solid #d1edc4",
      borderRadius: "8px",
      width: "100%",
      marginBottom: "24px",
    },
    searchCardTitle: {
      fontSize: "1rem",
      fontWeight: "bold",
      marginBottom: "8px",
      color: "#222222",
    },
    searchCardItem: {
      fontSize: "0.9rem",
      marginBottom: "4px",
    },
    reuseButton: (loading: boolean) => ({
      padding: "8px 12px",
      fontSize: "0.9rem",
      fontWeight: "bold",
      backgroundColor: loading ? "#adb5bd" : "#98E934",
      color: loading ? "#ffffff" : "#222222",
      border: "none",
      borderRadius: "100px",
      cursor: loading ? "not-allowed" : "pointer",
      width: "100%",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      transition: "all 0.2s ease",
      opacity: loading ? 0.7 : 1,
    }),
    statusText: {
      fontSize: "1rem",
      color: "#222222",
      textAlign: "center",
      margin: "8px 0",
    },
    errorText: {
      fontSize: "1rem",
      color: "#e12d39",
      textAlign: "center",
      margin: "8px 0",
    },
  }

  return (
    <div style={styles.container}>
      {/* Title Section */}
      <div style={styles.header}>
        <h1 style={styles.title}>Listing Data Processor and Date/Price Filter</h1>
        <h2 style={styles.subtitle}>Built by Jonathan Ye</h2>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Map Section */}
        <div style={styles.mapSection}>
          <ListingMap listings={listings} height="100%" width="100%" />
        </div>

        {/* Controls Section */}
        <div style={styles.controlsSection}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Enter Date Range:</label>
            <input
              type="text"
              placeholder="MM-DD-YYYY:MM-DD-YYYY"
              value={dateRangeText}
              onChange={handleDateChange}
              onKeyDown={handleKeyDown}
              style={styles.input}
              maxLength={21}
            />

            <label style={styles.label}>Enter Price Range:</label>
            <input
              type="text"
              placeholder="min:max"
              value={priceRangeText}
              onChange={handlePriceChange}
              onKeyDown={handleKeyDown}
              style={styles.input}
            />

            <button
              onClick={handleSubmit}
              disabled={loading || !isDateRangeValid || !isPriceRangeValid}
              style={styles.button(loading || !isDateRangeValid || !isPriceRangeValid)}
            >
              {loading ? "Searching..." : "Search Properties"}
            </button>
          </div>

          {/* Display Last Submission */}
          {lastSubmission && (
            <div style={styles.searchCard}>
              <h3 style={styles.searchCardTitle}>Current Search:</h3>
              <div style={styles.searchCardItem}>
                <strong>Date Range:</strong> {lastSubmission.dateRange}
              </div>
              <div style={styles.searchCardItem}>
                <strong>Price Range:</strong> {lastSubmission.priceRange}
              </div>

              {/* Reuse Search Button */}
              <button
                onClick={() => {
                  setDateRangeText(lastSubmission.dateRange)
                  setPriceRangeText(lastSubmission.priceRange)
                }}
                disabled={loading}
                style={styles.reuseButton(loading)}
              >
                {loading ? "Please wait..." : "Reuse This Search"}
              </button>
            </div>
          )}

          <div style={{ marginTop: "8px" }}>
            {subtext && <p style={styles.statusText}>{subtext}</p>}
            {error && <p style={styles.errorText}>{error}</p>}
            {loading && <p style={styles.statusText}>Loading data...</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
