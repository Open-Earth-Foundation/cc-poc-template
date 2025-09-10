import { useEffect, useState } from "react";
import { useAuth } from "@/core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { Button } from "@/core/components/ui/button";
import { Loader2, TestTube, CheckCircle, XCircle } from "lucide-react";

interface TestResult {
  endpoint: string;
  status: 'pending' | 'success' | 'error';
  data?: any;
  error?: string;
}

export function CityCatalystApiTester() {
  const { isAuthenticated, user } = useAuth();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runApiTests = async () => {
    if (!isAuthenticated) return;
    
    setIsRunning(true);
    console.log('🧪 Starting CityCatalyst API tests...');
    
    const tests: TestResult[] = [
      { endpoint: '/api/citycatalyst/inventories', status: 'pending' },
    ];
    
    setTestResults(tests);

    // Test 1: Get all inventories
    try {
      console.log('🌐 Testing /api/citycatalyst/inventories...');
      const response = await fetch('/api/citycatalyst/inventories', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ /api/citycatalyst/inventories SUCCESS:', data);
        console.log('📊 Full response structure:', JSON.stringify(data, null, 2));
        
        tests[0] = { ...tests[0], status: 'success', data };
        setTestResults([...tests]);
        
        // If we got cities, test individual city endpoints
        if (data.data && data.data.length > 0) {
          // Find the first city with a valid locode
          const validCity = data.data.find((city: any) => city.locode && city.locode !== 'undefined');
          console.log('🔍 Looking for valid city with locode from:', data.data);
          console.log('✅ Found valid city:', validCity);
          
          if (!validCity) {
            console.log('❌ No cities with valid locode found');
            return;
          }
          
          const locode = validCity.locode;
          
          // Test 2: Get city detail
          const cityDetailTest: TestResult = { 
            endpoint: `/api/citycatalyst/city/${locode}`, 
            status: 'pending' 
          };
          tests.push(cityDetailTest);
          setTestResults([...tests]);
          
          try {
            console.log(`🌐 Testing /api/citycatalyst/city/${locode}...`);
            const cityResponse = await fetch(`/api/citycatalyst/city/${encodeURIComponent(locode)}`, {
              credentials: 'include'
            });
            
            if (cityResponse.ok) {
              const cityData = await cityResponse.json();
              console.log(`✅ /api/citycatalyst/city/${locode} SUCCESS:`, cityData);
              
              cityDetailTest.status = 'success';
              cityDetailTest.data = cityData;
            } else {
              const errorText = await cityResponse.text();
              console.error(`❌ /api/citycatalyst/city/${locode} ERROR:`, errorText);
              
              cityDetailTest.status = 'error';
              cityDetailTest.error = `${cityResponse.status}: ${errorText}`;
            }
          } catch (error) {
            console.error(`❌ /api/citycatalyst/city/${locode} EXCEPTION:`, error);
            cityDetailTest.status = 'error';
            cityDetailTest.error = String(error);
          }
          
          // Test 3: Get city boundary
          const boundaryTest: TestResult = { 
            endpoint: `/api/citycatalyst/city/${locode}/boundary`, 
            status: 'pending' 
          };
          tests.push(boundaryTest);
          setTestResults([...tests]);
          
          try {
            console.log(`🌐 Testing /api/citycatalyst/city/${locode}/boundary...`);
            const boundaryResponse = await fetch(`/api/citycatalyst/city/${encodeURIComponent(locode)}/boundary`, {
              credentials: 'include'
            });
            
            if (boundaryResponse.ok) {
              const boundaryData = await boundaryResponse.json();
              console.log(`✅ /api/citycatalyst/city/${locode}/boundary SUCCESS:`, boundaryData);
              
              boundaryTest.status = 'success';
              boundaryTest.data = boundaryData;
            } else {
              const errorText = await boundaryResponse.text();
              console.error(`❌ /api/citycatalyst/city/${locode}/boundary ERROR:`, errorText);
              
              boundaryTest.status = 'error';
              boundaryTest.error = `${boundaryResponse.status}: ${errorText}`;
            }
          } catch (error) {
            console.error(`❌ /api/citycatalyst/city/${locode}/boundary EXCEPTION:`, error);
            boundaryTest.status = 'error';
            boundaryTest.error = String(error);
          }
          
          // Test 4: Get inventory for first available year
          if (firstCity.years && firstCity.years.length > 0) {
            const year = firstCity.years[0];
            const inventoryTest: TestResult = { 
              endpoint: `/api/citycatalyst/city/${locode}/inventory/${year}`, 
              status: 'pending' 
            };
            tests.push(inventoryTest);
            setTestResults([...tests]);
            
            try {
              console.log(`🌐 Testing /api/citycatalyst/city/${locode}/inventory/${year}...`);
              const inventoryResponse = await fetch(`/api/citycatalyst/city/${encodeURIComponent(locode)}/inventory/${year}`, {
                credentials: 'include'
              });
              
              if (inventoryResponse.ok) {
                const inventoryData = await inventoryResponse.json();
                console.log(`✅ /api/citycatalyst/city/${locode}/inventory/${year} SUCCESS:`, inventoryData);
                
                inventoryTest.status = 'success';
                inventoryTest.data = inventoryData;
              } else {
                const errorText = await inventoryResponse.text();
                console.error(`❌ /api/citycatalyst/city/${locode}/inventory/${year} ERROR:`, errorText);
                
                inventoryTest.status = 'error';
                inventoryTest.error = `${inventoryResponse.status}: ${errorText}`;
              }
            } catch (error) {
              console.error(`❌ /api/citycatalyst/city/${locode}/inventory/${year} EXCEPTION:`, error);
              inventoryTest.status = 'error';
              inventoryTest.error = String(error);
            }
          }
        }
      } else {
        const errorText = await response.text();
        console.error('❌ /api/citycatalyst/inventories ERROR:', errorText);
        
        tests[0] = { 
          ...tests[0], 
          status: 'error', 
          error: `${response.status}: ${errorText}` 
        };
      }
    } catch (error) {
      console.error('❌ /api/citycatalyst/inventories EXCEPTION:', error);
      tests[0] = { ...tests[0], status: 'error', error: String(error) };
    }
    
    setTestResults([...tests]);
    setIsRunning(false);
    console.log('🧪 CityCatalyst API tests completed!');
  };

  // Automatically run tests when user logs in
  useEffect(() => {
    if (isAuthenticated && user && testResults.length === 0) {
      console.log('🚀 User authenticated, starting automatic CityCatalyst API tests...');
      runApiTests();
    }
  }, [isAuthenticated, user]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Card className="mb-8 border-blue-200 bg-blue-50/50" data-testid="card-api-tester">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          CityCatalyst API Testing
          {isRunning && <Loader2 className="h-4 w-4 animate-spin" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Testing CityCatalyst API endpoints to understand data structure
          </p>
          <Button onClick={runApiTests} disabled={isRunning} size="sm">
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running Tests...
              </>
            ) : (
              'Run Tests Again'
            )}
          </Button>
        </div>
        
        {testResults.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Test Results:</h4>
            {testResults.map((result, index) => (
              <div key={index} className="flex items-center gap-3 p-2 rounded border bg-background">
                {result.status === 'pending' && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
                {result.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                {result.status === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
                
                <span className="font-mono text-sm flex-1">{result.endpoint}</span>
                
                <Badge variant={
                  result.status === 'success' ? 'default' : 
                  result.status === 'error' ? 'destructive' : 
                  'secondary'
                }>
                  {result.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
        
        <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
          <strong>Note:</strong> All API responses are logged to the server console for data structure analysis.
          Check the server logs for detailed CityCatalyst API response data.
        </div>
      </CardContent>
    </Card>
  );
}