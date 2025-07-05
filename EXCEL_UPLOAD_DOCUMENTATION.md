# Excel Upload Documentation

## Updated Excel Upload Functionality for Volunteers - Dynamic Column Detection

The Excel upload feature has been updated to use dynamic column detection based on Hebrew column names in Row 3. This makes the system more flexible and robust.

### Excel File Structure Expected

The system now uses dynamic column detection with the following structure:

#### Skip Rules
- **Columns A, B, C**: Completely ignored (A=empty, B=index numbers, C=timestamp)
- **Rows 1, 2**: Completely ignored (headers/metadata)
- **Row 3**: MUST contain Hebrew column names for detection
- **Data starts from Row 4**

#### Dynamic Column Detection
The system searches Row 3 for these Hebrew column names:

| Hebrew Column Name | Field Name | Description | Required |
|-------------------|------------|-------------|----------|
| שם פרטי | firstName | First Name | ✓ |
| שם משפחה | lastName | Last Name | ✓ |
| דוא"ל | email | Email | ✓ |
| מספר נייד | phoneNumber | Phone Number | Optional |
| מס זהות | idNumber | ID Number | Optional |
| כתובת | address | Address | Optional* |
| עיר/יישוב | city | City | Optional* |
| עיר | city | City (alternative) | Optional* |
| יישוב | city | Settlement (alternative) | Optional* |
| ניסיון בפינוי | beeExperience | Bee Removal Experience | Optional |
| ניסיון בגידול | beekeepingExperience | Beekeeping Experience | Optional |
| הדרכות | hasTraining | Training | Optional |
| היתר עבודה בגובה | heightPermit | Height Work Permit | Optional |
| קבלת פינוי בעבר | previousEvacuation | Previous Evacuation | Optional |
| חותמת זמן | signupDate | Signup Date/Timestamp | Optional |
| תאריך | signupDate | Date (alternative) | Optional |
| תאריך הרשמה | signupDate | Signup Date (alternative) | Optional |

**Note**: Columns with names like "קרבה לפינוי" and "ניקוד/משקל" are automatically ignored as they are calculated fields.

### ⚠️ Address Geocoding Validation
**CRITICAL**: The system now performs STRICT geocoding validation on all addresses:
- If an address and/or city is provided, it MUST be geocodable (convertible to latitude/longitude coordinates)
- Volunteers with addresses that cannot be geocoded will be **REJECTED** and not added to the system
- The system uses OpenStreetMap Nominatim service with Israeli address recognition
- Common street prefixes like "רחוב", "רח'", "רח״" are automatically handled
- Ensure all addresses and city names are accurate, complete, and recognizable

*Optional* fields with asterisk (*) are optional but must be geocodable if provided.

### Date/Timestamp Field
The system now processes timestamp/date fields with the following supported formats:
- **"1/6/22 0:26"** - M/D/YY H:MM format
- **"1/6/2022 0:26"** - M/D/YYYY H:MM format
- **Excel serial date numbers** - Automatic conversion
- **ISO date strings** - Standard format support
- **Date objects** - Direct Date object handling

The date field is optional and will be stored as the volunteer's signup date.

### Boolean Field Values
For boolean fields, the system accepts:
- `1`, `"1"`, `true`, `"true"`, `"כן"`, `"yes"` = True
- `0`, `"0"`, `false`, `"false"`, `"לא"`, `"no"`, or empty = False

### Features Implemented

#### Backend (`/api/users/bulk-create`)
1. **Bulk user creation** with proper error handling
2. **Duplicate detection** by email
3. **Firebase Auth integration** - creates users with default password
4. **Geocoding support** - converts addresses to coordinates
5. **Password forcing** - sets `requirePasswordChange: true` for all imported users
6. **Comprehensive error reporting**

#### Frontend (VolunteerManagement.jsx)
1. **Dynamic column detection** - searches Row 3 for Hebrew column names
2. **Flexible Excel parsing** - works regardless of column order
3. **Smart data validation** - checks required fields based on detected columns
4. **Progress tracking** - shows upload progress
5. **Error reporting** - detailed error messages with row numbers
6. **Phone number formatting** - automatically adds '0' prefix if missing
7. **Debug logging** - console logs for troubleshooting column detection

#### Password Management
1. **Default password**: `123456` for all imported users
2. **Force password change**: Users must change password on first login
3. **Password change component**: Dedicated UI for password updates
4. **Protected routes**: Blocks access until password is changed

### Usage Instructions

1. **Prepare Excel File**:
   - Columns A, B, C contain irrelevant data (will be skipped)
   - Rows 1-2 contain headers or irrelevant data (will be skipped)
   - **Row 3 MUST contain Hebrew column names** (see list above)
   - Data should start from Row 4
   - Required Hebrew names in Row 3: שם פרטי, שם משפחה, דוא"ל

2. **Upload Process**:
   - Go to Volunteer Management page
   - Click "העלאת קובץ Excel"
   - Select your Excel file
   - System will automatically detect columns based on Row 3 headers
   - Monitor progress in the dialog
   - Review any errors reported

3. **First Login for Imported Users**:
   - Users log in with email and password `123456`
   - System automatically prompts for password change
   - User must set new password before accessing the system

### Error Handling

#### Common Errors and Solutions:
- **"לא נמצאו עמודות חובה בשורה 3"**: Required Hebrew column names missing in Row 3
- **"חסרים שם פרטי"**: First name is missing or empty
- **"חסרים שם משפחה"**: Last name is missing or empty  
- **"חסרים דוא"ל תקין"**: Email is missing or invalid format
- **"משתמש קיים"**: User with this email already exists
- **"שגיאה ביצירת משתמש"**: Firebase Auth error (check email format)

#### Debug Information:
- Console logs show header row detection and column mapping
- Console logs show extracted data for first few rows
- Row numbers in error messages refer to Excel row numbers
- Progress bar shows processing status
- Detailed error list in upload dialog

### Testing

To test the functionality:

1. Create an Excel file with the described structure
2. Ensure Row 3 contains the exact Hebrew column names
3. Upload through the Volunteer Management interface
4. Check console logs for column detection and data extraction
5. Verify users were created in Firebase
6. Test login with default password and password change flow

### Advantages of Dynamic Column Detection

1. **Flexible column order**: Columns can be in any order as long as Row 3 has proper Hebrew names
2. **Robust parsing**: No dependency on fixed column positions
3. **Better error handling**: Clear messages when required columns are missing
4. **Easier maintenance**: Adding new fields only requires updating the column mappings
5. **User-friendly**: Works with various Excel file formats and layouts

### Security Notes

- Default password is temporary and must be changed
- Users cannot access protected routes until password is changed
- All imported users are flagged with `isExcelImported: true`
- Password change history is tracked
