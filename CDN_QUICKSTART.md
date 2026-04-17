# CDN Integration - Quick Start Guide

## What is CDN Integration?

The CDN Integration feature allows you to distribute your assets (images, videos, documents, 3D models) across global Content Delivery Networks for faster load times and reduced bandwidth costs.

## Getting Started

### 1. Add a CDN Provider

1. Click the **cloud upload icon** (cyan/blue gradient) in the top toolbar
2. Navigate to the **Providers** tab
3. Click **"Add CDN Provider"**
4. Fill in the configuration:
   - **Provider Name**: A friendly name (e.g., "Production CDN")
   - **Provider Type**: Select from Cloudflare, AWS CloudFront, Fastly, BunnyCDN, or Custom
   - **Endpoint/Domain**: Your CDN domain (e.g., cdn.example.com)
   - **API Key**: Your CDN provider's API key
   - **Zone ID** (optional): For providers that require it
5. Click **"Add Provider"**

### 2. Upload Assets to CDN

1. Go to the **Assets** tab
2. Select your CDN provider from the dropdown
3. Click **"Choose Files"** or drag files to upload
4. Click **"Upload"**
5. Watch the progress bar as your files upload
6. Once complete, you'll see your assets listed with their CDN URLs

### 3. Copy CDN URLs

Each uploaded asset displays its CDN URL. Click the **copy icon** next to any URL to copy it to your clipboard and use it in your code.

### 4. Optimize Assets

For unoptimized assets, click the **lightning bolt icon** to run optimization analysis. This will compress the asset and save bandwidth (typically 25-45% reduction).

### 5. Purge Cache

When you update an asset, click the **refresh icon** to purge the CDN cache and ensure users get the latest version.

## Dashboard Metrics

The **Dashboard** tab shows key performance indicators:

- **Total Assets**: Number of files on your CDN
- **Cache Hit Rate**: Percentage of requests served from cache (higher is better)
- **Total Bandwidth**: Total size of all assets
- **Avg Load Time**: Average time to load assets
- **Cost Savings**: Estimated monthly savings from CDN caching
- **Requests by Region**: Geographic distribution of asset requests

## Supported CDN Providers

- **Cloudflare**: Global CDN with 300+ locations
- **AWS CloudFront**: Amazon's enterprise CDN service
- **Fastly**: Real-time CDN with instant purge
- **BunnyCDN**: Cost-effective CDN solution
- **Custom**: Any CDN with a compatible API

## Best Practices

1. **Optimize Before Upload**: Run optimization on large images/videos to save bandwidth
2. **Use Descriptive Names**: Name your providers clearly (Production, Staging, etc.)
3. **Monitor Cache Hit Rate**: Aim for >70% hit rate for best performance
4. **Purge Strategically**: Only purge when assets actually change to maximize cache benefits
5. **Multiple Providers**: Use different providers for different asset types or regions

## Tips for Researchers

- Upload **large datasets** to CDN for faster sharing with collaborators globally
- Distribute **tutorial videos** via CDN for smoother playback
- Host **research paper PDFs** on CDN for faster download times
- Store **3D models and visualizations** on CDN for better VR/AR performance

## Keyboard Shortcuts

- Open CDN Panel: Click the cloud upload icon in toolbar
- No dedicated keyboard shortcuts (yet!)

## Troubleshooting

**Upload Failed**
- Check your API key is correct
- Verify your endpoint/domain is accessible
- Ensure you have sufficient quota on your CDN account

**Cache Not Purging**
- Some CDN providers have propagation delays (30-60 seconds)
- Check your API permissions include cache purge operations

**Provider Won't Save**
- All fields except Zone ID are required
- API keys must be valid and active
- Test connection before saving

## Example Use Cases

### Upload Research Banner
1. Add Cloudflare provider
2. Upload `research-banner.png`
3. Copy CDN URL: `https://cdn.crowelab.io/assets/1234-research-banner.png`
4. Use in your app or website

### Optimize Video Tutorial
1. Upload `tutorial-intro.mp4` to AWS CloudFront
2. Click optimize button
3. System compresses video (saves ~40% bandwidth)
4. Share optimized CDN URL with students

### Multi-Region Dataset Distribution
1. Configure multiple CDN providers for different regions
2. Upload large dataset CSV files
3. Share appropriate regional URL with collaborators
4. Monitor request distribution in dashboard

## Security Notes

- API keys are stored in your browser's local storage
- Keys are never transmitted to third parties
- Use read-write API keys, not account admin keys
- Rotate keys regularly for security

## Need Help?

- Check the video tutorials in the Tutorial panel
- Review the CDN Integration documentation (CDN_INTEGRATION.md)
- Contact your CDN provider's support for API issues
