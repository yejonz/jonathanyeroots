  // lib/listingDataProcessor.ts
  interface RawListingData {
    id: string;
    rawData: any;
    createdAt: Date;
    unparsedAddress: string | null;
    rawPhotoDataId: string | null;
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
    // Add other fields as needed
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
        const listing: ProcessedListing = {
          id: this.cleanField(rawRow.id, String),
          address: this.cleanField(this.getFromRawData(rawRow, 'unparsedAddress'), String),
          city: this.cleanField(this.getFromRawData(rawRow, 'city'), String),
          state: this.cleanField(this.getFromRawData(rawRow, 'state'), String),
          price: this.cleanField(this.getFromRawData(rawRow, 'price'), Number),
          bedrooms: this.cleanField(this.getFromRawData(rawRow, 'bedrooms'), Number),
          bathrooms: this.cleanField(this.getFromRawData(rawRow, 'bathrooms'), Number),
          squareFeet: this.cleanField(this.getFromRawData(rawRow, 'squareFeet'), Number),
          propertyType: this.cleanField(this.getFromRawData(rawRow, 'propertyType'), String),
          photoUrls: this.getRelatedPhotos(rawRow.rawPhotoDataId),
          status: this.cleanField(this.getFromRawData(rawRow, 'mlsStatus'), String, 'ACTIVE'),
          createdAt: this.cleanField(rawRow.createdAt, this.parseDateTime) || '',
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
  }