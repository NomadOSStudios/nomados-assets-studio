#if UNITY_EDITOR
using System;
using System.IO;
using UnityEditor;
using UnityEngine;

// Put this script in an Editor folder. Select the exported manifest first.
public static class UIMAssetImporter
{
    [Serializable] private class Manifest { public int version; public Entry[] assets; }
    [Serializable] private class Entry { public string file; public int width, height; public float left, bottom, right, top; }

    [MenuItem("Tools/UIM Studio/Apply sprite settings")]
    public static void ApplySpriteSettings()
    {
        string manifestPath = AssetDatabase.GetAssetPath(Selection.activeObject);
        if (Path.GetFileName(manifestPath) != "uim-manifest.json")
        { EditorUtility.DisplayDialog("UIM Studio", "Select uim-manifest.json in the Project window first.", "OK"); return; }
        try
        {
            Manifest manifest = JsonUtility.FromJson<Manifest>(File.ReadAllText(manifestPath));
            if (manifest == null || manifest.version != 1 || manifest.assets == null) throw new Exception("Unsupported manifest.");
            string folder = Path.GetDirectoryName(manifestPath).Replace('\\', '/');
            int imported = 0;
            foreach (Entry asset in manifest.assets)
            {
                if (string.IsNullOrEmpty(asset.file) || Path.GetFileName(asset.file) != asset.file || !asset.file.EndsWith(".png", StringComparison.OrdinalIgnoreCase)) continue;
                var importer = AssetImporter.GetAtPath(folder + "/" + asset.file) as TextureImporter;
                if (importer == null) continue;
                importer.textureType = TextureImporterType.Sprite;
                importer.spriteImportMode = SpriteImportMode.Single;
                importer.spritePixelsPerUnit = 100;
                importer.alphaIsTransparency = true;
                importer.mipmapEnabled = false;
                importer.textureCompression = TextureImporterCompression.Uncompressed;
                importer.maxTextureSize = Mathf.Min(8192, Mathf.NextPowerOfTwo(Mathf.Max(asset.width, asset.height)));
                var settings = new TextureImporterSettings();
                importer.ReadTextureSettings(settings);
                settings.spriteMeshType = SpriteMeshType.FullRect;
                importer.SetTextureSettings(settings);
                importer.spriteBorder = new Vector4(asset.left, asset.bottom, asset.right, asset.top);
                importer.SaveAndReimport();
                imported++;
            }
            Debug.Log("UIM Studio: configured " + imported + " sprites.");
        }
        catch (Exception exception) { Debug.LogError("UIM Studio import failed: " + exception.Message); }
    }
}
#endif
