  // lib/listingDataProcessor.ts
  interface RawListingData {
    id: string;
    rawData: any;
    createdAt: Date;
    unparsedAddress: string | null;
    rawPhotoDataId: string | null;
    zipCode: string | null;
    // Add other fields as needed
  }

  // id: true,
  // address: true,
  // city: true,
  // state: true,
  // price: true,
  // bedrooms: true,
  // bathrooms: true,
  // squareFeet: true,
  // propertyType: true,
  // photoUrls: true,
  // status: true,
  // createdAt: true
  
  interface RawPhotoData {
    id: string;
    rawListingId: string;
    photoUrls: string[];
    // Add other fields as needed
  }
  
  interface RawLoanData {
    id: string;
    rawData: any;
    // Add other fields as needed
  }
  
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
    // Non-displayed fields
    zipCode: string;
  }
  
  export class ListingDataProcessor {
    private rawListingData: RawListingData[];
    private rawPhotoData: RawPhotoData[];
    private rawLoanData: RawLoanData[];
  
    constructor(
      rawListingData: RawListingData[],
      rawPhotoData: RawPhotoData[],
      rawLoanData: RawLoanData[]
    ) {
      this.rawListingData = rawListingData;
      this.rawPhotoData = rawPhotoData;
      this.rawLoanData = rawLoanData;
    }
  
    processAll(): ProcessedListing[] {
      const listings: ProcessedListing[] = [];
      for (const rawRow of this.rawListingData) {
        const listing = this.processSingleListing(rawRow);
        if (listing) {
          listings.push(listing);
        }
      }
      return listings;
    }
  
    private processSingleListing(rawRow: RawListingData): ProcessedListing | null {
      try {
        const formattedAddress = this.formatAddress(rawRow.rawData);
        const listing: ProcessedListing = {
          id: this.cleanField(rawRow.id, String),
          address: formattedAddress.address,
          city: formattedAddress.city,
          state: formattedAddress.state,
          // ListPrice and OriginalListPrice properties also exist in rawData
          price: this.cleanField(this.getFromRawData(rawRow, 'CurrentPrice'), Number),
          // Bedrooms Possible property also exists
          bedrooms: this.cleanField(this.getFromRawData(rawRow, 'BedroomsTotal'), Number),
          // BathroomsFull, BathroomsHalf, etc also exist
          bathrooms: this.cleanField(this.getFromRawData(rawRow, 'BathroomsTotalInteger'), Number),
          squareFeet: this.cleanField(this.getFromRawData(rawRow, 'LotSizeSquareFeet'), Number),
          propertyType: this.cleanField(this.getFromRawData(rawRow, 'PropertyType'), String),
          photoUrls: this.getRelatedPhotos(rawRow.rawPhotoDataId),
          status: this.cleanField(this.getFromRawData(rawRow, 'mlsStatus'), String, 'ACTIVE'),
          createdAt: this.cleanField(rawRow.createdAt, this.parseDateTime) || '',
          // Other fields I won't display for this project:
          zipCode: this.cleanField(rawRow.zipCode, String) || '',
        };
        return listing;
      } catch (error) {
        console.error(`Error processing listing ${rawRow.id}:`, error);
        return null;
      }
    }
  
    private getRelatedPhotos(rawPhotoDataId: string | null): string[] {
      if (!rawPhotoDataId) {
        return [];
      }
      const photos = this.rawPhotoData.filter(photo => photo.id === rawPhotoDataId);
      if (photos.length === 0) {
        return [];
      }
      
      // Flatten all photo URLs
      return photos.reduce((urls, photo) => {
        return urls.concat(photo.photoUrls || []);
      }, [] as string[]);
    }
  
    private cleanField<T>(value: any, converter: (v: any) => T, defaultValue?: T): T {
      if (value === null || value === undefined) {
        return defaultValue as T;
      }
      
      try {
        if (converter === this.parseDateTime) {
          return this.parseDateTime(value) as unknown as T;
        }
        return converter(value);
      } catch (error) {
        return defaultValue as T;
      }
    }
  
    private parseDateTime(value: any): string | null {
      if (value === null || value === undefined) {
        return null;
      }
      
      if (value instanceof Date) {
        return value.toISOString();
      }
      
      try {
        return new Date(value).toISOString();
      } catch (error) {
        return null;
      }
    }
  
    private getFromRawData(row: RawListingData, key: string): any {
      if (row.rawData && typeof row.rawData === 'object' && key in row.rawData) {
        return row.rawData[key];
      }
      return (row as any)[key];
    }

    private formatAddress(rawData: any): { address: string; city: string; state: string } {
      if (!rawData) {
        return { address: '', city: '', state: '' };
      }
    
      // Extract street components
      const streetNumber = rawData.StreetNumber || '';
      const streetDirPrefix = rawData.StreetDirPrefix || '';
      const streetName = rawData.StreetName || '';
      const streetSuffix = rawData.StreetSuffix || '';
      const streetDirSuffix = rawData.StreetDirSuffix || '';
      const unitNumber = rawData.UnitNumber || '';
      
      // Extract city, state, and postal code
      const city = rawData.City || '';
      const state = rawData.StateOrProvince || '';
      const postalCode = rawData.PostalCode || '';
      
      // Format street components with proper capitalization
      const formatCapitalization = (text: string): string => {
        if (!text) return '';
        return text
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      };
      
      // Build the street address
      let streetAddress = [
        streetNumber,
        streetDirPrefix,
        formatCapitalization(streetName),
        streetSuffix,
        streetDirSuffix
      ].filter(Boolean).join(' ');
      
      // Add unit number if available
      if (unitNumber) {
        streetAddress += ` ${unitNumber}`;
      }
      
      // Format city with proper capitalization
      const formattedCity = formatCapitalization(city);
      
      // Format state as uppercase
      const formattedState = state.toUpperCase();
      
      // Build the full address in the required format
      const fullAddress = `${streetAddress}, ${formattedCity}, ${formattedState}, ${postalCode}`;
      
      return {
        address: fullAddress,
        city: formattedCity,
        state: formattedState
      };
    }
  }