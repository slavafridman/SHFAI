package bzq.shf.utils;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import bzq.shf.model.LoadTables;
import bzq.utils.AppInfo;
import bzq.utils.AppResources;
import bzq.utils.TablesContainer;

public class SharingUtils {
	protected static final String RELOAD_TABLES_SERVLET = "loadTables.do";

	protected static void callUrl(String inUrl) throws Exception {
		HttpURLConnection conn = null;
		BufferedReader rd = null;
		try{
			URL url = new URL(inUrl);
			conn = (HttpURLConnection)url.openConnection();
			conn.setRequestMethod("GET");
			conn.setDoOutput(true);
			conn.connect();
			String line;
			rd = new BufferedReader(new InputStreamReader(conn.getInputStream()));
			StringBuffer sb = new StringBuffer();
			
			while ((line = rd.readLine()) != null) {
				sb.append(line + '\n');
			}
		}finally{
			if(conn!=null){
				conn.disconnect();
			}
			if(rd!=null){
				rd.close();
			}
		}
	}
	
	
	public static void reloadTables(String tableName) {
		int i = 1;
		String path = null;
		try {
			while ((path = System.getProperty("APP_PATH" + Integer.toString(i))) != null) {
				callUrl(path + RELOAD_TABLES_SERVLET + "?tableName="+tableName);
				i++;
			}
			
			//for dvlp only
			if(i==1){
				AppResources appRes=AppResources.getInstance();
				TablesContainer tc=appRes.getTablesContainer();
				LoadTables loader=new LoadTables(tc);
				loader.load(tableName);
			}
			
		} catch (Exception e) {
//			System.out.println("Reloading tables error "+ e.getLocalizedMessage());
			e.printStackTrace();
		}
	}
}
