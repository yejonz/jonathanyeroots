interface RawListingData {
  id: string;
  rawData: any;
  createdAt: Date;
  unparsedAddress: string | null;
  rawPhotoDataId: string | null;
  zipCode: string | null;
}

interface RawPhotoData {
  id: string;
  rawListingId: string;
  photoUrls: string[];
}

// Cleaned listing that is returned
interface ProcessedListing {
  id: string;
  address: string;
  city: string;
  state: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  propertyType: string;
  photoUrls: string[];
  status: string;
  createdAt: string;
  // Used to locate marker in mapbox component:
  latitude: number;
  longitude: number;
  // Other fields I won't display for this project:
  zipCode: string;
}

/**
 * 
 * The ListingDataProcessor processes RawListingData and RawPhotoData 
 * (within a given time frame) to return cleaned listings.
 * 
 * The cleaned listings include the essential attributes that I will 
 * display on my dashboard for this project. Not all attributes from 
 * the provided Listing data model are included, but enough so that 
 * technical proficiency in data processing/cleaning is displayed.
 *
 * @example
 * const processor = new ListingDataProcessor(raw_listings, raw_photos);
 * const listings = processor.processAll();
 *
 * @class
 */
export class ListingDataProcessor {
  private rawListingData: RawListingData[];
  private rawPhotoData: RawPhotoData[];

  constructor(
    rawListingData: RawListingData[],
    rawPhotoData: RawPhotoData[],
  ) {
    this.rawListingData = rawListingData;
    this.rawPhotoData = rawPhotoData;
  }

  /**
   * Processes all raw listing data and returns an array of formatted listings.
   * @returns {ProcessedListing[]} Array of processed listings
   */
  processAll(): ProcessedListing[] {
    return this.rawListingData
      .map(rawRow => this.processSingleListing(rawRow))
      .filter((listing): listing is ProcessedListing => listing !== null);
  }

  /**
   * Processes a single raw listing into a cleaned listing.
   * @param {RawListingData} rawRow - The raw listing data to process
   * @returns {ProcessedListing | null} The processed listing or null if processing failed
   */
  private processSingleListing(rawRow: RawListingData): ProcessedListing | null {
    if (!rawRow) return null;

    try {
      const formattedAddress = this.formatAddress(rawRow.rawData);
      
      return {
        id: this.cleanField(rawRow.id, String),
        address: formattedAddress.address,
        city: formattedAddress.city,
        state: formattedAddress.state,
        price: this.cleanField(this.getFromRawData(rawRow, 'CurrentPrice'), Number),
        bedrooms: this.cleanField(this.getFromRawData(rawRow, 'BedroomsTotal'), Number),
        bathrooms: this.cleanField(this.getFromRawData(rawRow, 'BathroomsTotalInteger'), Number),
        squareFeet: this.cleanField(this.getFromRawData(rawRow, 'LotSizeSquareFeet'), Number),
        propertyType: this.cleanField(this.getFromRawData(rawRow, 'PropertyType'), String),
        photoUrls: this.getRelatedPhotos(rawRow.rawPhotoDataId),
        status: this.cleanField(this.getFromRawData(rawRow, 'mlsStatus'), String, 'ACTIVE'),
        createdAt: this.cleanField(rawRow.createdAt, this.parseDateTime) || '',
        latitude: this.cleanField(this.getFromRawData(rawRow, 'Latitude'), Number),
        longitude: this.cleanField(this.getFromRawData(rawRow, 'Longitude'), Number),
        zipCode: this.cleanField(rawRow.zipCode, String) || '',
      };
    } catch (error) {
      console.error(`Error processing listing ${rawRow.id}:`, error);
      return null;
    }
  }

  /**
   * Retrieves photo URLs associated with a listing based on its photo data ID.
   * @param {string | null} rawPhotoDataId - The ID referencing related photo data
   * @returns {string[]} Array of photo URLs associated with the listing (empty if no photos found)
   */
  private getRelatedPhotos(rawPhotoDataId: string | null): string[] {
    if (!rawPhotoDataId) {
      return [];
    }
    
    const photoData = this.rawPhotoData.find(photo => photo.id === rawPhotoDataId);
    return photoData?.photoUrls || [];
  }

  /**
   * Safely converts a value using the provided converter function.
   * @param {any} value - The value to clean/convert
   * @param {Function} converter - The conversion function
   * @param {T} [defaultValue] - Optional default value to use if conversion fails
   * @returns {T} The converted value or defaultValue if conversion failed
   */
  private cleanField<T>(value: any, converter: (v: any) => T, defaultValue?: T): T {
    if (value == null) return defaultValue as T;
    
    try {
      if (converter === this.parseDateTime) {
        return this.parseDateTime(value) as unknown as T;
      }
      return converter(value);
    } catch {
      return defaultValue as T;
    }
  }

  /**
   * Parses a date value into an ISO string format.
   * @param {any} value - The date value to parse
   * @returns {string | null} ISO string representation of the date or null if invalid
   */
  private parseDateTime(value: any): string | null {
    if (value == null) return null;
    
    try {
      const date = value instanceof Date ? value : new Date(value);
      return date.toISOString();
    } catch {
      return null;
    }
  }

  /**
   * Gets a value from the raw data by key.
   * @param {RawListingData} row - The raw listing data
   * @param {string} key - The key to retrieve
   * @returns {any} The value from raw data or undefined if not found
   */
  private getFromRawData(row: RawListingData, key: string): any {
    return row?.rawData?.[key] ?? (row as any)[key];
  }

  /**
   * Formats address components into a standardized format.
   * @param {any} rawData - The raw data containing address components
   * @returns {Object} Object containing formatted address, city, and state
   */
  private formatAddress(rawData: any): { address: string; city: string; state: string } {
    if (!rawData) {
      return { address: '', city: '', state: '' };
    }

    // Format capitalization helper
    const capitalize = (text: string): string => {
      if (!text) return '';
      return text
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    };
    
    // Collect address components
    const addressParts = {
      streetNumber: rawData.StreetNumber || '',
      streetDirPrefix: rawData.StreetDirPrefix || '',
      streetName: capitalize(rawData.StreetName || ''),
      streetSuffix: rawData.StreetSuffix || '',
      streetDirSuffix: rawData.StreetDirSuffix || '',
      unitNumber: rawData.UnitNumber || '',
      city: capitalize(rawData.City || ''),
      state: (rawData.StateOrProvince || '').toUpperCase(),
      postalCode: rawData.PostalCode || ''
    };
    
    // Build street address
    const streetParts = [
      addressParts.streetNumber, 
      addressParts.streetDirPrefix,
      addressParts.streetName,
      addressParts.streetSuffix,
      addressParts.streetDirSuffix
    ].filter(Boolean);
    
    let streetAddress = streetParts.join(' ');
    if (addressParts.unitNumber) {
      streetAddress += ` ${addressParts.unitNumber}`;
    }
    
    // Complete address
    const fullAddress = `${streetAddress}, ${addressParts.city}, ${addressParts.state}, ${addressParts.postalCode}`;
    
    return {
      address: fullAddress,
      city: addressParts.city,
      state: addressParts.state
    };
  }
}