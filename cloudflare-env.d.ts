declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    WHATSAPP_VERIFY_TOKEN?: string;
    WHATSAPP_ACCESS_TOKEN?: string;
    WHATSAPP_PHONE_NUMBER_ID?: string;
    WHATSAPP_GRAPH_VERSION?: string;
    META_APP_SECRET?: string;
    STAFF_USER_EMAILS?: string;
    WHATSAPP_BUSINESS_NUMBER?: string;
    ENVIRONMENT?: string;
  }
}
