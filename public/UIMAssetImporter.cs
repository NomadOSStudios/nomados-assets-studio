#if UNITY_EDITOR
using System;
using System.IO;
using UnityEditor;
using UnityEngine;
using UnityEngine.UI;

// Put this script in an Editor folder. Select the exported manifest first.
public static class UIMAssetImporter
{
    [Serializable] private class Body { public float x, y, width, height; }
    [Serializable] private class Entry { public string file; public string name; public string state; public int width, height; public float left, bottom, right, top; public Body body; }
    [Serializable] private class Placement { public string name; public string file; public float x, y, width, height; }
    [Serializable] private class Screen { public string name; public float width, height; public Placement[] assets; }
    [Serializable] private class Manifest { public int version; public float scale; public float pixelsPerUnit; public Entry[] assets; public Screen screen; }

    [MenuItem("Tools/UIM Studio/Apply sprite settings")]
    public static void ApplySpriteSettings()
    {
        var manifest = Load(out var folder);
        if (manifest == null) return;
        try { Debug.Log("UIM Studio: configured " + Apply(manifest, folder) + " sprites."); }
        catch (Exception exception) { Debug.LogError("UIM Studio import failed: " + exception.Message); }
    }

    /// <summary>A prefab named after the screen: one Image per placed asset at
    /// its exact position and size, buttons with their state sprites wired.
    /// Sprite settings are applied first.</summary>
    [MenuItem("Tools/UIM Studio/Build screen prefab")]
    public static void BuildScreenPrefab()
    {
        var manifest = Load(out var folder);
        if (manifest == null) return;
        if (manifest.screen == null || manifest.screen.assets == null || manifest.screen.assets.Length == 0)
        { EditorUtility.DisplayDialog("UIM Studio", "This pack carries no screen layout. Place the assets in the Screen builder and export the kit again.", "OK"); return; }
        try
        {
            Apply(manifest, folder);
            var scale = manifest.scale > 0f ? manifest.scale : 1f;
            var root = new GameObject(manifest.screen.name, typeof(RectTransform)) { layer = LayerMask.NameToLayer("UI") };
            var rootRect = (RectTransform)root.transform;
            rootRect.sizeDelta = new Vector2(manifest.screen.width, manifest.screen.height);
            var built = 0;
            foreach (var placement in manifest.screen.assets)
            {
                var entry = Array.Find(manifest.assets, a => a.file == placement.file);
                var sprite = entry != null ? AssetDatabase.LoadAssetAtPath<Sprite>(folder + "/" + entry.file) : null;
                if (!sprite) continue;
                var go = new GameObject(placement.name, typeof(RectTransform), typeof(CanvasRenderer), typeof(Image)) { layer = root.layer };
                var rect = (RectTransform)go.transform;
                rect.SetParent(rootRect, false);
                // Screen coordinates are top-left, y down, at 1x; the PNG holds
                // padding around the body, so the image sits that much up-left.
                rect.anchorMin = rect.anchorMax = rect.pivot = new Vector2(0f, 1f);
                var bodyX = entry.body != null ? entry.body.x / scale : 0f;
                var bodyY = entry.body != null ? entry.body.y / scale : 0f;
                rect.anchoredPosition = new Vector2(placement.x - bodyX, -(placement.y - bodyY));
                rect.sizeDelta = new Vector2(entry.width / scale, entry.height / scale);
                var image = go.GetComponent<Image>();
                image.sprite = sprite;
                image.type = sprite.border.sqrMagnitude > 0f ? Image.Type.Sliced : Image.Type.Simple;
                WireButton(go, image, manifest, folder, placement.name);
                built++;
            }
            var path = AssetDatabase.GenerateUniqueAssetPath(folder + "/" + Safe(manifest.screen.name) + ".prefab");
            PrefabUtility.SaveAsPrefabAsset(root, path);
            UnityEngine.Object.DestroyImmediate(root);
            AssetDatabase.SaveAssets();
            Selection.activeObject = AssetDatabase.LoadAssetAtPath<GameObject>(path);
            Debug.Log("UIM Studio: built " + path + " with " + built + " assets.");
        }
        catch (Exception exception) { Debug.LogError("UIM Studio prefab build failed: " + exception.Message); }
    }

    static void WireButton(GameObject go, Image image, Manifest manifest, string folder, string assetName)
    {
        Sprite Find(string state)
        {
            var entry = Array.Find(manifest.assets, a => a.name == assetName && a.state == state);
            return entry != null ? AssetDatabase.LoadAssetAtPath<Sprite>(folder + "/" + entry.file) : null;
        }
        var pressed = Find("pressed"); var hover = Find("hover"); var disabled = Find("disabled");
        if (!pressed && !hover && !disabled) return;
        var button = go.AddComponent<Button>();
        button.targetGraphic = image;
        button.transition = Selectable.Transition.SpriteSwap;
        var states = button.spriteState;
        states.highlightedSprite = hover; states.pressedSprite = pressed; states.disabledSprite = disabled;
        states.selectedSprite = hover;
        button.spriteState = states;
    }

    static Manifest Load(out string folder)
    {
        folder = null;
        string manifestPath = AssetDatabase.GetAssetPath(Selection.activeObject);
        if (Path.GetFileName(manifestPath) != "uim-manifest.json")
        { EditorUtility.DisplayDialog("UIM Studio", "Select uim-manifest.json in the Project window first.", "OK"); return null; }
        var manifest = JsonUtility.FromJson<Manifest>(File.ReadAllText(manifestPath));
        if (manifest == null || manifest.version != 1 || manifest.assets == null) { Debug.LogError("UIM Studio: unsupported manifest."); return null; }
        folder = Path.GetDirectoryName(manifestPath).Replace('\\', '/');
        return manifest;
    }

    static int Apply(Manifest manifest, string folder)
    {
        int imported = 0;
        foreach (Entry asset in manifest.assets)
        {
            if (string.IsNullOrEmpty(asset.file) || Path.GetFileName(asset.file) != asset.file || !asset.file.EndsWith(".png", StringComparison.OrdinalIgnoreCase)) continue;
            var importer = AssetImporter.GetAtPath(folder + "/" + asset.file) as TextureImporter;
            if (importer == null) continue;
            importer.textureType = TextureImporterType.Sprite;
            importer.spriteImportMode = SpriteImportMode.Single;
            // Pixels per unit follows the export scale, so a 2x or 4x pack keeps
            // the same size and border thickness on screen as 1x.
            importer.spritePixelsPerUnit = (manifest.pixelsPerUnit > 0f ? manifest.pixelsPerUnit : 100f) * (manifest.scale > 0f ? manifest.scale : 1f);
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
        return imported;
    }

    static string Safe(string name)
    {
        var chars = name.ToCharArray();
        for (var i = 0; i < chars.Length; i++) if (Array.IndexOf(Path.GetInvalidFileNameChars(), chars[i]) >= 0 || chars[i] == '/') chars[i] = '-';
        var safe = new string(chars).Trim();
        return string.IsNullOrEmpty(safe) ? "Screen" : safe;
    }
}
#endif
